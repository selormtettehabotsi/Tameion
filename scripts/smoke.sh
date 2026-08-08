#!/usr/bin/env bash
# Route smoke test: every endpoint returns its expected status, the CSRF
# double-submit flow works, the exempt auth paths stay exempt, and role
# guards still reject the wrong actor.
#
# Requires the stack to be up. Usage: bash scripts/smoke.sh [base_url]
set -uo pipefail

BASE="${1:-http://localhost:5000}"
JAR_DIR="$(mktemp -d)"
trap 'rm -rf "$JAR_DIR"' EXIT

pass=0; fail=0

# check <label> <expected-status> <actual-status>
check() {
  if [ "$2" = "$3" ]; then
    printf '  ok   %-58s %s\n' "$1" "$3"; pass=$((pass+1))
  else
    printf '  FAIL %-58s expected %s, got %s\n' "$1" "$2" "$3"; fail=$((fail+1))
  fi
}

# status <method> <path> [jar] [csrf] [body] [content-type]
status() {
  local method="$1" path="$2" jar="${3:-}" csrf="${4:-}" body="${5:-}" ct="${6:-application/json}"
  local args=(-s -o /dev/null -w '%{http_code}' -X "$method" --max-time 20)
  [ -n "$jar" ] && args+=(-b "$jar" -c "$jar")
  [ -n "$csrf" ] && args+=(-H "X-CSRF-Token: $csrf")
  [ -n "$body" ] && args+=(-H "Content-Type: $ct" -d "$body")
  curl "${args[@]}" "$BASE$path"
}

# json <method> <path> <jar> [csrf] [body]
json() {
  local method="$1" path="$2" jar="$3" csrf="${4:-}" body="${5:-}"
  local args=(-s -X "$method" --max-time 20 -b "$jar" -c "$jar")
  [ -n "$csrf" ] && args+=(-H "X-CSRF-Token: $csrf")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  curl "${args[@]}" "$BASE$path"
}

# Pull a field out of a JSON response without assuming jq is installed.
field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const o=JSON.parse(s);const p=process.argv[1].split(".");let v=o;for(const k of p)v=v?.[k];console.log(v??"")}catch{console.log("")}})' "$1"; }

echo "== Public routes =="
check "GET  /api/health"                  200 "$(status GET /api/health)"
check "GET  /api/books"                   200 "$(status GET /api/books)"
check "GET  /api/books?q=clean&sort=title" 200 "$(status GET '/api/books?q=clean&sort=title')"
check "GET  /api/books/978-0132350884"    200 "$(status GET /api/books/978-0132350884)"
check "GET  /api/books/does-not-exist"    404 "$(status GET /api/books/does-not-exist)"

echo "== Unauthenticated guards =="
check "GET  /api/patron/dashboard (anon)" 401 "$(status GET /api/patron/dashboard)"
check "GET  /api/admin/dashboard  (anon)" 401 "$(status GET /api/admin/dashboard)"

echo "== CSRF-exempt auth paths (no token, must NOT be 403) =="
check "POST /api/auth/login (bad creds)"  401 "$(status POST /api/auth/login "$JAR_DIR/x" "" '{"identifier":"nobody","password":"wrong"}')"
check "POST /api/auth/forgot-password"    200 "$(status POST /api/auth/forgot-password "$JAR_DIR/x" "" '{"email":"nobody@example.com"}')"
check "POST /api/auth/reset-password"     400 "$(status POST /api/auth/reset-password "$JAR_DIR/x" "" '{"token":"bad","password":"password123"}')"
check "POST /api/auth/verify-email"       400 "$(status POST /api/auth/verify-email "$JAR_DIR/x" "" '{"token":"bad"}')"

echo "== CSRF enforced on non-exempt routes =="
check "POST /api/auth/register (no token)" 403 "$(status POST /api/auth/register "$JAR_DIR/x" "" '{"knust_id":"STU-9","full_name":"X","email":"x@y.gh","user_type":"student","password":"password123"}')"

# ---- Patron session ----
PJAR="$JAR_DIR/patron"
PTOK=$(json POST /api/auth/login "$PJAR" "" '{"identifier":"STU-2024001","password":"password123"}' | field data.csrfToken)
echo "== Patron session (csrf token: ${PTOK:0:12}...) =="
[ -n "$PTOK" ] && { printf '  ok   %-58s issued\n' "login returns csrfToken"; pass=$((pass+1)); } \
               || { printf '  FAIL %-58s missing\n' "login returns csrfToken"; fail=$((fail+1)); }
check "GET  /api/auth/me"                 200 "$(status GET /api/auth/me "$PJAR")"
check "GET  /api/patron/dashboard"        200 "$(status GET /api/patron/dashboard "$PJAR")"
check "GET  /api/patron/loans"            200 "$(status GET /api/patron/loans "$PJAR")"
check "GET  /api/patron/fines"            200 "$(status GET /api/patron/fines "$PJAR")"
check "GET  /api/patron/reservations"     200 "$(status GET /api/patron/reservations "$PJAR")"
check "GET  /api/admin/dashboard (patron)" 403 "$(status GET /api/admin/dashboard "$PJAR")"
check "POST reserve WITHOUT csrf token"   403 "$(status POST /api/books/978-0131103627/reserve "$PJAR")"
check "POST reserve WITH csrf token"      201 "$(status POST /api/books/978-0131103627/reserve "$PJAR" "$PTOK")"
check "POST reserve again (duplicate)"    409 "$(status POST /api/books/978-0131103627/reserve "$PJAR" "$PTOK")"
check "POST reserve with WRONG csrf"      403 "$(status POST /api/books/978-0262033848/reserve "$PJAR" "deadbeef")"

# ---- Staff session ----
SJAR="$JAR_DIR/staff"
STOK=$(json POST /api/auth/login "$SJAR" "" '{"identifier":"LIB-001","password":"password123"}' | field data.csrfToken)
echo "== Staff session =="
check "GET  /api/admin/dashboard"         200 "$(status GET /api/admin/dashboard "$SJAR")"
check "GET  /api/admin/members"           200 "$(status GET /api/admin/members "$SJAR")"
check "GET  /api/admin/members?q=kwame"   200 "$(status GET '/api/admin/members?q=kwame' "$SJAR")"
check "GET  /api/admin/loans"             200 "$(status GET /api/admin/loans "$SJAR")"
check "GET  /api/admin/fines"             200 "$(status GET /api/admin/fines "$SJAR")"
check "GET  /api/admin/reservations"      200 "$(status GET /api/admin/reservations "$SJAR")"
check "GET  /api/admin/staff"             200 "$(status GET /api/admin/staff "$SJAR")"
check "GET  /api/admin/branches"          200 "$(status GET /api/admin/branches "$SJAR")"
check "GET  /api/admin/audit-log"         200 "$(status GET /api/admin/audit-log "$SJAR")"
check "GET  /api/admin/reports"           200 "$(status GET /api/admin/reports "$SJAR")"
check "GET  /api/admin/export/books"      200 "$(status GET /api/admin/export/books "$SJAR")"
check "GET  /api/admin/export/members"    200 "$(status GET /api/admin/export/members "$SJAR")"
check "GET  /api/patron/dashboard (staff)" 403 "$(status GET /api/patron/dashboard "$SJAR")"

echo "== Staff mutations (borrow / return / cover_url) =="
check "PUT  /api/admin/books cover_url"   200 "$(status PUT /api/admin/books/978-0132350884 "$SJAR" "$STOK" '{"cover_url":"https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg"}')"
check "PUT  cover_url rejects javascript:" 400 "$(status PUT /api/admin/books/978-0132350884 "$SJAR" "$STOK" '{"cover_url":"javascript:alert(1)"}')"
check "PUT  cover_url rejects http://"    400 "$(status PUT /api/admin/books/978-0132350884 "$SJAR" "$STOK" '{"cover_url":"http://example.com/a.jpg"}')"
check "PUT  /api/admin/members avatar_url" 200 "$(status PUT /api/admin/members/1 "$SJAR" "$STOK" '{"avatar_url":"https://images.pexels.com/photos/10417388/pexels-photo-10417388.jpeg"}')"

LOAN=$(json POST /api/admin/loans/checkout "$SJAR" "$STOK" '{"book_isbn":"978-0134757599","member_knust_id":"STU-2024001","due_days":14}')
LOAN_ID=$(echo "$LOAN" | field data.id)
if [ -n "$LOAN_ID" ]; then
  printf '  ok   %-58s loan #%s\n' "POST /api/admin/loans/checkout" "$LOAN_ID"; pass=$((pass+1))
  check "POST /api/admin/loans/:id/renew"  200 "$(status POST "/api/admin/loans/$LOAN_ID/renew" "$SJAR" "$STOK" '{"days":7}')"
  check "POST /api/admin/loans/:id/return" 200 "$(status POST "/api/admin/loans/$LOAN_ID/return" "$SJAR" "$STOK")"
else
  printf '  FAIL %-58s no loan id: %s\n' "POST /api/admin/loans/checkout" "$(echo "$LOAN" | head -c 120)"; fail=$((fail+1))
fi
check "POST checkout WITHOUT csrf"        403 "$(status POST /api/admin/loans/checkout "$SJAR" "" '{"book_isbn":"978-0134757599","member_knust_id":"STU-2024001"}')"
check "POST /api/auth/logout"             200 "$(status POST /api/auth/logout "$SJAR" "$STOK")"

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1

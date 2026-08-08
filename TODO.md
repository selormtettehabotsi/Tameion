# Tameion — TODO

## Bugs & Security Fixes (Critical — Do First)

- [x] 1. Add `.gitignore` — exclude node_modules/, .env, build artifacts
- [x] 2. Fix session secret in docker-compose — use .env file, not hardcoded string
- [x] 3. Remove token leakage — stop exposing emailToken and resetToken in API responses
- [x] 4. Wrap multi-step writes in transactions — checkout and return need BEGIN/COMMIT
- [x] 5. Guard fine balance from going negative — add floor check on fine payment
- [x] 6. Add CSRF protection to POST /register — currently exempt, enables CSRF account creation

## Bugs & Security Fixes (High)

- [x] 7. Fix client Dockerfile — build with `vite build` + serve with nginx, not dev server
- [x] 8. Escape SQL ILIKE wildcards — sanitize %, _ in search inputs
- [x] 9. Add CHECK constraint — `copies_available >= 0` on books table
- [x] 10. Add pagination to patron loan history

## Features — Must Have

- [x] 11. Email service integration (Nodemailer/SendGrid)
- [x] 12. Pagination (server + client, all list endpoints)
- [x] 13. Admin reservation management
- [x] 14. Admin staff management
- [x] 15. Loan due-date extension / renewal
- [x] 16. Overdue auto-detection (scheduled job)
- [x] 17. Global auth context (React Context)

## Features — Should Have

- [x] 18. Test suite (unit + integration)
- [x] 19. Input validation library (Zod)
- [x] 20. Error boundaries & toast notifications
- [x] 21. Shared UI component library
- [x] 22. Production Docker setup (nginx for static)
- [x] 23. CI/CD pipeline
- [x] 24. Structured logging (pino/winston)
- [x] 25. Database migrations

## Features — Nice to Have

- [x] 26. Dark mode
- [x] 27. Mobile-responsive patron navbar
- [x] 28. Book cover images
- [x] 29. Bulk operations (CSV import/export)
- [x] 30. Audit log
- [x] 31. Reports / analytics
- [x] 32. Accessibility (aria, focus trapping, keyboard nav)
- [x] 33. ESLint + Prettier config

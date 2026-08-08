-- Seed data for Tameion
-- Passwords are bcrypt hashes of "password123" with cost 12

-- Branch libraries
INSERT INTO branch_libraries (branch_name, college, location) VALUES
  ('Main Library', 'University Library System', 'Main Campus, near Great Hall'),
  ('College of Engineering Library', 'College of Engineering', 'College of Engineering Block A');

-- Members (patrons)
-- password: password123
INSERT INTO members (knust_id, full_name, email, phone, user_type, programme, password_hash, email_verified) VALUES
  ('STU-2024001', 'Kwame Mensah', 'kwame.mensah@st.knust.edu.gh', '0241234567', 'student', 'BSc Computer Science', '$2b$12$gQiCcekBWjB1DXI0oLxhX.2v1vAp/ebtOvemxfOH8Uc42KikriZT2', TRUE),
  ('FAC-2024010', 'Dr. Ama Boateng', 'ama.boateng@knust.edu.gh', '0551234567', 'faculty', 'Department of Computer Science', '$2b$12$gQiCcekBWjB1DXI0oLxhX.2v1vAp/ebtOvemxfOH8Uc42KikriZT2', TRUE);

-- Staff
INSERT INTO staff (knust_staff_id, full_name, email, role, branch_id, password_hash) VALUES
  ('LIB-001', 'Janet Owusu', 'janet.owusu@knust.edu.gh', 'librarian', 1, '$2b$12$gQiCcekBWjB1DXI0oLxhX.2v1vAp/ebtOvemxfOH8Uc42KikriZT2');

-- Books
INSERT INTO books (isbn, title, author, publisher, genre, copies_total, copies_available, shelf_location, branch_id) VALUES
  ('978-0134685991', 'Effective Java', 'Joshua Bloch', 'Addison-Wesley', 'Computer Science', 5, 3, 'CS-A01', 1),
  ('978-0201633610', 'Design Patterns', 'Gang of Four', 'Addison-Wesley', 'Computer Science', 3, 2, 'CS-A02', 1),
  ('978-0132350884', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 'Computer Science', 4, 4, 'CS-A03', 1),
  ('978-0596009205', 'Head First Design Patterns', 'Eric Freeman', 'O''Reilly Media', 'Computer Science', 2, 1, 'CS-B01', 2),
  ('978-0321125217', 'Domain-Driven Design', 'Eric Evans', 'Addison-Wesley', 'Software Engineering', 3, 3, 'SE-A01', 2),
  ('978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', 'Computer Science', 6, 5, 'CS-A04', 1),
  ('978-0131103627', 'The C Programming Language', 'Brian W. Kernighan', 'Prentice Hall', 'Computer Science', 3, 3, 'CS-A05', 1),
  ('978-0137081073', 'The Clean Coder', 'Robert C. Martin', 'Prentice Hall', 'Software Engineering', 2, 2, 'SE-A02', 1),
  ('978-1491950357', 'Building Microservices', 'Sam Newman', 'O''Reilly Media', 'Software Engineering', 3, 2, 'SE-B01', 2),
  ('978-0134757599', 'Refactoring', 'Martin Fowler', 'Addison-Wesley', 'Software Engineering', 2, 1, 'SE-A03', 1),
  ('978-0062316097', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'Harper', 'History', 4, 4, 'HI-A01', 1),
  ('978-0743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'Literature', 5, 5, 'LI-A01', 1),
  ('978-0061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 'Literature', 4, 3, 'LI-A02', 1),
  ('978-0141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 'Literature', 3, 3, 'LI-A03', 1),
  ('978-0470088708', 'Intermediate Microeconomics', 'Hal R. Varian', 'W.W. Norton', 'Economics', 4, 4, 'EC-A01', 2),
  ('978-0131872486', 'Engineering Mechanics: Statics', 'Russell C. Hibbeler', 'Pearson', 'Engineering', 5, 4, 'EN-A01', 2),
  ('978-0073398242', 'Fundamentals of Electric Circuits', 'Charles K. Alexander', 'McGraw-Hill', 'Engineering', 4, 3, 'EN-A02', 2),
  ('978-1292024943', 'Organic Chemistry', 'Paula Yurkanis Bruice', 'Pearson', 'Science', 3, 2, 'SC-A01', 1),
  ('978-0199540617', 'Molecular Biology of the Cell', 'Bruce Alberts', 'Oxford University Press', 'Science', 3, 3, 'SC-A02', 1),
  ('978-0393614039', 'A History of Modern Africa', 'Richard Reid', 'Cambridge University Press', 'History', 2, 2, 'HI-A02', 1);

-- Loan transactions (some active, one returned, one overdue)
INSERT INTO loan_transactions (book_isbn, member_id, staff_id, checkout_date, due_date, return_date, status) VALUES
  ('978-0134685991', 1, 1, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', NULL, 'active'),
  ('978-0201633610', 1, 1, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', NULL, 'overdue'),
  ('978-0132350884', 1, 1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE - INTERVAL '14 days', 'returned'),
  ('978-0596009205', 2, 1, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', NULL, 'active');

-- Reservations
INSERT INTO reservations (book_isbn, member_id, request_date, expiry_date, status) VALUES
  ('978-0321125217', 1, NOW(), NOW() + INTERVAL '7 days', 'pending');

-- Fine accounts
INSERT INTO fine_accounts (member_id, outstanding_balance) VALUES
  (1, 6.00),
  (2, 0.00);

-- Fine transactions (for the overdue loan)
INSERT INTO fine_transactions (fine_account_id, loan_transaction_id, days_overdue, rate_per_day, amount, settled) VALUES
  (1, 2, 6, 1.00, 6.00, FALSE);

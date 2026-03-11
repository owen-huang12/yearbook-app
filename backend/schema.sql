CREATE TABLE allStudents(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    is_handed_out BOOLEAN NOT NULL,
    is_purchased BOOLEAN NOT NULL,
    email VARCHAR(255)
);

CREATE TABLE checkIns(
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES allStudents(student_id)
);

INSERT INTO allStudents (student_id, name, is_handed_out, is_purchased) 
VALUES
(100032101, 'Aisha Patel', false, true),
(100032102, 'Marcus Johnson', false, true),
(100032103, 'Sofia Garcia', false, true),
(100032104, 'James Chen', false, true),
(100032105, 'Emma Rodriguez', false, false),
(100032106, 'Liam Thompson', false, true),
(100032107, 'Zoe Kim', false, false),
(100032108, 'Noah Alvarez', false, false),
(100032109, 'Olivia Martinez', false, true),
(100032110, 'Ethan Brown', false, false),
(100032111, 'Isabella Lopez', false, true),
(100032112, 'Lucas Anderson', false, true),
(100032113, 'Mia Taylor', false, false),
(100032114, 'Mason White', false, true),
(100032115, 'Charlotte Lee', false, true),
(100032116, 'Benjamin Davis', false, true),
(100032117, 'Amelia Wilson', false, false),
(100032118, 'Oliver Jackson', false, false),
(100032119, 'Harper Moore', false, true),
(100032120, 'Elijah Martin', false, true),
(100032121, 'Evelyn Hernandez', false, true),
(100032122, 'Logan Clark', false, false);
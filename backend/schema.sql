CREATE TABLE allStudents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    grade INTEGER NOT NULL,
    email VARCHAR(255)
)

CREATE TABLE checkIns (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    is_handed_out BOOLEAN NOT NULL,
    is_purchased BOOLEAN NOT NULL,
    FOREIGN KEY (student_id) REFRENCES allStudents(student_id)
)

INSERT INTO allStudents (student_id, name) 
VALUES
(100032101, 'Aisha Patel'),
(100032102, 'Marcus Johnson'),
(100032103, 'Sofia Garcia'),
(100032104, 'James Chen'),
(100032105, 'Emma Rodriguez'),
(100032106, 'Liam Thompson'),
(100032107, 'Zoe Kim'),
(100032108, 'Noah Alvarez'),
(100032109, 'Olivia Martinez'),
(100032110, 'Ethan Brown'),
(100032111, 'Isabella Lopez'),
(100032112, 'Lucas Anderson'),
(100032113, 'Mia Taylor'),
(100032114, 'Mason White'),
(100032115, 'Charlotte Lee'),
(100032116, 'Benjamin Davis'),
(100032117, 'Amelia Wilson'),
(100032118, 'Oliver Jackson'),
(100032119, 'Harper Moore'),
(100032120, 'Elijah Martin'),
(100032121, 'Evelyn Hernandez'),
(100032122, 'Logan Clark');
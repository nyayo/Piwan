import { pool } from "../config/db.js";

const activitiesQuery = `
    CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role ENUM('user', 'consultant', 'admin') NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

const eventQuery = `
            CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date DATETIME NOT NULL,
            location VARCHAR(255),
            organizer VARCHAR(255),
            status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
`

const reviewQuery = `
            CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            user_id INT NOT NULL,
            consultant_id INT NOT NULL,
            rating INT CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
            UNIQUE KEY unique_review (appointment_id, user_id)
);
`

const appointmentsQuery = `
    CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    consultant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
    cancellation_reason TEXT,
    notes TEXT,
    mood INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE
    );
    `

const consultantsQuery = `
            CREATE TABLE IF NOT EXISTS consultants (
            id INT PRIMARY KEY AUTO_INCREMENT,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            experience INT DEFAULT 0,
            language VARCHAR(100),
            education VARCHAR(255),
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            password VARCHAR(255) NOT NULL,
            role ENUM('consultant') DEFAULT 'consultant',
            profession VARCHAR(100),
            dob DATE,
            profile_image VARCHAR(255),
            gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        `

const adminQuery = `
            CREATE TABLE IF NOT EXISTS admin (
            id INT PRIMARY KEY AUTO_INCREMENT,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            experience INT DEFAULT 0,
            language VARCHAR(100),
            education VARCHAR(255),
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'super_admin') DEFAULT 'admin',
            profession VARCHAR(100),
            dob DATE,
            profile_image VARCHAR(255),
            gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            department VARCHAR(100),
            access_level ENUM('basic', 'moderate', 'full') DEFAULT 'basic',
            last_login TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        `

const userQuery = `
            CREATE TABLE IF NOT EXISTS users ( 
            id INT PRIMARY KEY AUTO_INCREMENT,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            username VARCHAR(100) UNIQUE NOT NULL, 
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            password VARCHAR(255) NOT NULL,
            role ENUM('user') DEFAULT 'user',
            dob DATE,
            profile_image VARCHAR(255),
            gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
            `

const createTable = async (tableName, query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} table created successfully.`)   
    } catch (error) {
        console.log(error)
    }
}

const createAllTables = async() => {
    try {
        await createTable('Users', userQuery);
        await createTable('Admin', adminQuery);
        await createTable('Consultants', consultantsQuery);
        await createTable('Appointments', appointmentsQuery);
        await createTable('Reviews', reviewQuery);
        await createTable('Events', eventQuery);
        await createTable('Activities', activitiesQuery);
        console.log('All tables created successfully.')
    } catch (error) {
        console.log('Error during table creation: ', error)
    }
}

export {createTable, createAllTables};
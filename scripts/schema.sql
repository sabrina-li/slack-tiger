DROP DATABASE IF EXISTS tigerslackDB_development;
CREATE DATABASE IF NOT EXISTS tigerslackDB_development;

USE tigerslackDB_development;

CREATE TABLE IF NOT EXISTS messages(
message_ts 	DOUBLE(17,6) AUTO_INCREMENT PRIMARY KEY NOT NULL,
thread_ts		DOUBLE(17,6),
tags VARCHAR(100) NULL,
ticket_no VARCHAR(100),
message_preview VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user(
user_id 	varchar(30) PRIMARY KEY NOT NULL,
username varchar(50),
first_name varchar(50),
last_name varchar(50)
);
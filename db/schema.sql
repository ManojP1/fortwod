--- load with 
--- sqlite3 database.db < schema.sql
CREATE TABLE user (
	user VARCHAR(20) PRIMARY KEY,
	password VARCHAR(20) NOT NULL,
	skill VARCHAR(20),
	year integer,
	month VARCHAR(3),
	day integer,
	playmorning BOOLEAN default 'f',
	playafternoon BOOLEAN default 'f',
	playevening BOOLEAN default 'f'
);
CREATE TABLE score (
	username VARCHAR(20) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE,
	score INTEGER DEFAULT 0
);

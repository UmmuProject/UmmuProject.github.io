<?php
session_start();
$servername = "localhost";
$username = "root"; // Database username
$password = ""; // Database password
$dbname = "dblogin";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $inputUsername = $_POST['username'];
    $inputPassword = $_POST['password'];

    $sql = "SELECT * FROM tblogin WHERE username=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $inputUsername);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if (password_verify($inputPassword, $row['password'])) {
            // Correct username and password
            $_SESSION['username'] = $inputUsername;
            header("Location: index.html");
            exit();
        } else {
            // Wrong password
            echo "Incorrect password";
        }
    } else {
        // No user found
        echo "No user found with that username";
    }
    $stmt->close();
}
$conn->close();
?>

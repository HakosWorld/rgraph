import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

import backgroundGif from "../styles/backgrrond1fps.gif"; // Import background image

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch(
        "https://learn.reboot01.com/api/auth/signin",
        {
          method: "POST",
          headers: { Authorization: `Basic ${credentials}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      localStorage.setItem("token", data);
      console.log("Token stored in localStorage:", data);

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundImage: `url(${backgroundGif})`, // Use the imported GIF
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="xs">
  <Box
    sx={{
      backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark semi-transparent background
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 4px 30px rgba(255, 255, 255, 0.1)", // Soft white shadow
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)", // Light border
    }}
  >
    <Typography
      component="h1"
      variant="h4"
      sx={{
        textAlign: "center",
        background: "linear-gradient(135deg, #00FFFF, #FF00FF)", // Neon gradient
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontWeight: "bold",
        mb: 3,
      }}
    >
      Welcome Back!
    </Typography>
    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        variant="filled" 

        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)", // Semi-transparent input
            color: "#FFFFFF", // White text
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.3)", // Light border
            },
            "&:hover fieldset": {
              borderColor: "#00FFFF", // Neon cyan on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF00FF", // Neon magenta on focus
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(83, 83, 83, 0.7)", // Light label
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#FF00FF", // Neon magenta on focus
          },
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        variant="filled" 

        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)", // Semi-transparent input
            color: "#FFFFFF", // White text
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.3)", // Light border
            },
            "&:hover fieldset": {
              borderColor: "#00FFFF", // Neon cyan on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF00FF", // Neon magenta on focus
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(137, 137, 137, 0.7)", // Light label
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#FF00FF", // Neon magenta on focus
          },
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{
          mt: 3,
          mb: 2,
          borderRadius: "8px",
          background: "linear-gradient(135deg, #00FFFF, #FF00FF)", // Neon gradient
          color: "#000", // Dark text for contrast
          fontWeight: "bold",
          "&:hover": {
            background: "linear-gradient(135deg, #FF00FF, #00FFFF)", // Reverse gradient on hover
          },
        }}
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: "#000" }} /> // Dark spinner
        ) : (
          "Login"
        )}
      </Button>
      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            borderRadius: "8px",
            backgroundColor: "rgba(255, 0, 0, 0.2)", // Semi-transparent red
            color: "#FF0000", // Red text
            border: "1px solid rgba(255, 0, 0, 0.3)", // Red border
          }}
        >
          {errorMessage}
        </Alert>
      )}
    </Box>
  </Box>
</Container>
    </Box>
  );
}

export default LoginPage;

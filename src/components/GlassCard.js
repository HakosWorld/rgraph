import React from "react";
import { Paper, Typography } from "@mui/material";

const GlassCard = ({ title, children }) => {
  return (
    <Paper
      sx={{
        padding: 3,
        borderRadius: 3,
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0px 0px 20px rgba(0, 255, 255, 0.5)",
        color: "white",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
};

export default GlassCard;

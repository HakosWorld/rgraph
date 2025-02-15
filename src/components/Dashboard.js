import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Typography,
  Alert,
  Grid,
  Paper,
  Box,
  Button,
  CssBaseline,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { motion } from "framer-motion";

const HolographicBackground = () => (
  <div
    style={{
      position: "fixed",
      width: "100%",
      height: "100%",
      background: "linear-gradient(45deg, #1a1a2e 0%, #16213e 100%)", // Lighter gradient
      zIndex: -2,
    }}
  >
    <div
      style={{
        position: "absolute",
        width: "200%",
        height: "200%",
        background: `linear-gradient(
          45deg,
          rgba(0, 255, 255, 0.1) 20%,
          rgba(255, 0, 255, 0.1) 40%,
          rgba(0, 255, 0, 0.1) 60%,
          rgba(255, 255, 0, 0.1) 80%
        )`,
        animation: "rotate 20s linear infinite",
        zIndex: -1,
      }}
    />
  </div>
);

const GlassPanel = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      background: "rgba(255, 255, 255, 0.1)", // Less transparent
      backdropFilter: "blur(12px)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.2)", // Brighter border
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {children}
  </motion.div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Normal Query: Fetch basic user information
        const userResponse = await fetch(
          "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `
                query {
                  user {
                    id
                    attrs
                    login
                    email
                    firstName
                    lastName
                    auditRatio
                    totalUp
                    totalDown
                  }
                }
              `,
            }),
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        if (userData.errors && userData.errors.length > 0) {
          throw new Error(userData.errors[0].message || "Unknown error");
        }
       // console.log(userData.data.user[0].id);
        let varuser = userData.data.user[0].id;

        // Nested Query: Fetch user audits with nested information about the group
        const auditsResponse = await fetch(
          "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `
                query {
                  user {
                    audits {
                      auditedAt
                      auditorId
                      closureType
                      id
                      group {
                        pathByPath {
                          object {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              `,
            }),
          }
        );

        if (!auditsResponse.ok) {
          throw new Error("Failed to fetch audits data");
        }

        const auditsData = await auditsResponse.json();
        if (auditsData.errors && auditsData.errors.length > 0) {
          throw new Error(auditsData.errors[0].message || "Unknown error");
        }

        // Query with Arguments: Fetch transactions with specific arguments
        const transactionsResponse = await fetch(
          "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `
                 query GetTransactions($userId: Int!) {
                  transaction(
                    where: {
                         userId: { _eq: $userId }
                       type: { _eq: "xp" }
                       _and: [
                         { path: { _nlike: "%/%piscine%/%" } }
                         { path: { _nlike: "%/%piscine%/" } }
                         { path: { _nlike: "%/%piscine/%" } }
                       ]
                     }
                   ) {
                     amount
                     type
                     createdAt
                     path
                   }
                 }
               `,
              variables: {
                userId: varuser,
              },
            }),
          }
        );

        if (!transactionsResponse.ok) {
          throw new Error("Failed to fetch transactions data");
        }

        const transactionsData = await transactionsResponse.json();
        if (transactionsData.errors && transactionsData.errors.length > 0) {
          throw new Error(
            transactionsData.errors[0].message || "Unknown error"
          );
        }

        // Combine the data from all queries
        const data = {
          user: userData.data.user,
          audits: auditsData.data.user[0].audits,
          transaction: transactionsData.data.transaction,
        };

        setData(data);

        // Filter and aggregate XP data for graph
        const filteredTransactions = data.transaction.filter((transaction) =>
          transaction.path.startsWith("/bahrain/bh-module")
        );

        const aggregatedData = filteredTransactions.reduce((acc, transaction) => {
          const date = new Date(transaction.createdAt).toLocaleDateString();
          const moduleName = transaction.path.split("/bahrain/bh-module/")[1]?.split("/")[0] || "Unknown";
        
          if (!acc[date]) { 
            acc[date] = {}; 
          }
          if (!acc[date][moduleName]) {
            acc[date][moduleName] = 0;
          }
        
          acc[date][moduleName] += transaction.amount;
          return acc;
        },
          {}
        );

        const graphData = Object.keys(aggregatedData).flatMap((date) => 
          Object.keys(aggregatedData[date]).map((moduleName) => ({
            date,
            moduleName,
            xpAmount: aggregatedData[date][moduleName] / 1000,
          }))
        );

        setGraphData(graphData);
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Calculate pass/fail statistics
  const audits = data.audits || [];
  const reassignedAudits = audits.filter(
    (audit) => audit.closureType === "reassigned"
  );
  const unusedAudits = audits.filter((audit) => audit.closureType === "unused");
  const succeededAudits = audits.filter(
    (audit) => audit.closureType === "succeeded"
  );
  const expiredAudits = audits.filter(
    (audit) => audit.closureType === "expired"
  );
  const totalAudits = audits.length;
  let reassignedRatio = (reassignedAudits.length / totalAudits) * 100;

  let unusedRatio = (unusedAudits.length / totalAudits) * 100;

  let succeededRatio = (succeededAudits.length / totalAudits) * 100;

  let expiredRatio = (expiredAudits.length / totalAudits) * 100;

  // Data for Pie chart
  const chartData = [
    { name: "Reassigned", value: reassignedRatio },
    { name: "Unused", value: unusedRatio },
    { name: "Succeeded", value: succeededRatio },
    { name: "Expired", value: expiredRatio },
  ];

  // Calculate statistics
  const totalXP = data.transaction.reduce((sum, t) => sum + t.amount, 0);
  const auditRatio = data.user[0].auditRatio;

  return (
    <div
      onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
      style={{
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
        color: "#ffffff", // Ensure text is white
      }}
    >
      <CssBaseline />
      <HolographicBackground />

      {/* Dynamic Cursor Spotlight */}
      <div
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          background: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, 
            rgba(0, 255, 255, 0.1) 0%, 
            rgba(0, 0, 0, 0) 70%)`,
          pointerEvents: "none",
          transition: "background 0.3s ease-out",
          zIndex: -1,
        }}
      />

      {/* Particles Background */}
      <Particles
        init={particlesInit}
        options={{
          particles: {
            number: { value: 50 },
            color: { value: ["#0ff", "#f0f"] },
            opacity: { value: 0.5 },
            size: { value: 2 },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              outModes: "out",
              trail: {
                enable: true,
                length: 10,
                fillColor: "#000",
              },
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
            },
          },
        }}
        style={{ position: "fixed", zIndex: -1 }}
      />

      {/* Main Content */}
      <Container
        sx={{
          pt: 10,
          transform: `translate(
            ${(cursorPos.x - window.innerWidth / 2) * 0.01}px, 
            ${(cursorPos.y - window.innerHeight / 2) * 0.01}px
          )`,
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Logout Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{ position: "absolute", top: 20, right: 20 }}
        >
          <Button
            variant="contained"
            onClick={handleLogout}
            sx={{
              background: "linear-gradient(45deg, #ff00ff 0%, #00ffff 100%)",
              backdropFilter: "blur(10px)",
              "&:hover": {
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
              },
            }}
          >
            Logout
          </Button>
        </motion.div>
        {/* Dashboard Title */}
        <Typography
          variant="h2"
          sx={{
            background: "linear-gradient(45deg, #0ff 0%, #f0f 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            mb: 4,
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          Your Epic Dashboard
        </Typography>
        {/* User Info Grid */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* User Information */}
          <Grid item xs={12} md={6}>
            <GlassPanel>
              <Typography variant="h6" sx={{ color: "#00FFFF", mb: 2 }}>
                {" "}
                {/* Neon Cyan */}
                User Information
              </Typography>
              <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                {" "}
                {/* White */}
                Login:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].login}
                </span>
              </Typography>
              <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                Email:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].email}
                </span>
              </Typography>
              <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                Name:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].firstName} {data.user[0].lastName}
                </span>
              </Typography>
              <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                Phone Number:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].attrs.PhoneNumber || "Phone not available"}
                </span>
              </Typography>
            </GlassPanel>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={6}>
            <GlassPanel>
              <Typography variant="h6" sx={{ color: "#FF00FF", mb: 2 }}>
                {" "}
                {/* Neon Magenta */}
                Statistics
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "#FFFFFF", fontWeight: "bold" }}
              >
                {" "}
                {/* White & Bold Label */}
                Total Upvotes:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].totalUp
                    ? (data.user[0].totalUp / 1000).toFixed(2)
                    : "N/A"}{" "}
                  KB
                </span>
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "#FFFFFF", fontWeight: "bold" }}
              >
                Total Downvotes:
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {data.user[0].totalDown
                    ? (data.user[0].totalDown / 1000).toFixed(2)
                    : "N/A"}{" "}
                  KB
                </span>
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "#FFFFFF", fontWeight: "bold" }}
              >
                Audit Ratio:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {" "}
                  {auditRatio.toFixed(2)}
                </span>
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "#FFFFFF", fontWeight: "bold" }}
              >
                Total XP:{" "}
                <span style={{ color: "#AAAAAA", fontWeight: "normal" }}>
                  {totalXP ? (totalXP / 1000).toFixed(2) + " KB" : "0 KB"}
                </span>
              </Typography>
            </GlassPanel>
          </Grid>
        </Grid>
        {/* XP Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <GlassPanel sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                XP Earned Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={graphData}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="date" stroke="#0ff" tick={{ fill: "#fff" }} />
                  <YAxis stroke="#0ff" tick={{ fill: "#fff" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                    }}
                    formatter={(value, name, props) => {
                      const moduleName = props.payload?.moduleName || "Unknown";
                      return [`${value} KB`, `${moduleName}`];
                    }}

                  />
                  <Line
                    type="monotone"
                    dataKey="xpAmount"
                    stroke="url(#lineGradient)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#0ff" />
                      <stop offset="100%" stopColor="#f0f" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </GlassPanel>{" "}
          </Grid>
        </Grid>
        {/* Audit Chart */}
        <Box sx={{ mb: 120 }}>
          {" "}
          {/* Add margin-bottom here */}
          <GlassPanel sx={{ mb: 60 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Audit Results
            </Typography>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                boxShadow: "none",
              }}
            >
              {" "}
              <PieChart width={400} height={300}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  stroke="none"
                >
                  <Cell fill="#2E86C1" /> {/* Dark Blue */}
                  <Cell fill="#8E44AD" /> {/* Dark Purple */}
                  <Cell fill="#1ABC9C" /> {/* Dark Teal */}
                  <Cell fill="#34495E" /> {/* Dark Gray-Blue */}
                </Pie>

                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />

                <Legend />
              </PieChart>
              {/* Right-side Text */}
              <Typography variant="h6" sx={{ ml: 4, color: "white" }}>
                What happened with the audits you got before.
              </Typography>
            </Paper>
          </GlassPanel>
        </Box>
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            mt: 4,
            mb: 2,
            color: "#FF00FF",
            textShadow: "0 0 10px rgba(255, 0, 255, 0.5)",
          }}
        >
          Just play with the background
        </Typography>{" "}
      </Container>
    </div>
  );
};

export default Dashboard;

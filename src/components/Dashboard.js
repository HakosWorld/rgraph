import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Tooltip as RechartTooltip, Legend as RechartLegend } from "recharts";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [auditResults, setAuditResults] = useState([]);

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
        const response = await fetch(
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
                  transaction(where: { type: { _eq: "xp" } }) {
                    amount
                    type
                    createdAt
                    path
                  }
                }
              `,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const { data, errors } = await response.json();
        if (errors && errors.length > 0) {
          throw new Error(errors[0].message || "Unknown error");
        }

        setData(data); // Store the fetched data

        // Filter and aggregate XP data for graph
        const filteredTransactions = data.transaction.filter(transaction =>
          transaction.path.startsWith("/bahrain/bh-module")
        );

        const aggregatedData = filteredTransactions.reduce((acc, transaction) => {
          const date = new Date(transaction.createdAt).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date] += transaction.amount;
          return acc;
        }, {});

        const graphData = Object.keys(aggregatedData).map((date) => ({
          date,
          xpAmount: aggregatedData[date],
        }));

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
    localStorage.removeItem("token"); // Clear token
    navigate("/login"); // Redirect to login
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
  const audits = data.user[0].audits || [];

  const reassignedAudits = audits.filter((audit) => audit.closureType === "reassigned");
  const unusedAudits = audits.filter((audit) => audit.closureType === "unused");
  const succeededAudits = audits.filter((audit) => audit.closureType === "succeeded");
  const expiredAudits = audits.filter((audit) => audit.closureType === "expired");

  const totalAudits = audits.length;

  const reassignedRatio = (reassignedAudits.length / totalAudits) * 100;
  const unusedRatio = (unusedAudits.length / totalAudits) * 100;
  const succeededRatio = (succeededAudits.length / totalAudits) * 100;
  const expiredRatio = (expiredAudits.length / totalAudits) * 100;

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
    
    <Container sx={{ mt: 5 }}>

<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Typography variant="h4" sx={{ textAlign: "center", mb: 4 }}>
        User Dashboard
      </Typography>

      {/* User Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">User Information</Typography>
            <Typography variant="body1">Login: {data.user[0].login}</Typography>
            <Typography variant="body1">Email: {data.user[0].email}</Typography>
            <Typography variant="body1">
              Name: {data.user[0].firstName} {data.user[0].lastName}
            </Typography>
            <Typography variant="body1">
              Phone Number: {data.user[0].attrs.Phone}
            </Typography>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Statistics</Typography>
            <Typography variant="body1">
              Total Upvotes: {data.user[0].totalUp}
            </Typography>
            <Typography variant="body1">
              Total Downvotes: {data.user[0].totalDown}
            </Typography>
            <Typography variant="body1">
              Audit Ratio: {auditRatio}
            </Typography>
            <Typography variant="body1">Total XP: {totalXP}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* XP Graph */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        XP Earned Over Time
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="xpAmount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

       {/* Audit Pass/Fail Pie Chart */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        All Assigned Audits
      </Typography>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"            
              >
                <Cell fill="#00C49F" />
                <Cell fill="#FF8042" />
                <Cell fill="#0088FE" />
                <Cell fill="#FFBB28" />
              </Pie>
              
              <Tooltip />
              
              <Legend />
           
            </PieChart>
                    {/* Right-side Text */}
                    <Typography variant="h6" sx={{ ml: 4 }}>
              All Audit Codes
            </Typography>
          </Paper>
        </Grid>
      </Grid>

    
    </Container>
  );
};

export default Dashboard;

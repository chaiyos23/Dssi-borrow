import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { History as LogIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const NotificationHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลประวัติการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogIcon color="primary" /> ประวัติการยิงอีเมลแจ้งเตือน
        </Typography>
        <Typography variant="caption" color="text.secondary">
          บันทึกประวัติการทวงถามอุปกรณ์ค้างส่งที่ทำรายการโดยแอดมินผ่านปุ่มยิงแจ้งเตือนด่วน
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>รหัสบันทึก</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>วันเวลาที่ส่ง</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสรายการยืม</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>สถานะการส่ง</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  ไม่พบข้อมูลประวัติการแจ้งเตือนในระบบ
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.log_id} hover>
                  <TableCell>#{log.log_id}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{formatDate(log.sent_at)}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{log.student_id}</TableCell>
                  <TableCell>{log.student_name}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>#{log.transaction_id}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.assets_id}</TableCell>
                  <TableCell>{log.assets_name}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>
                    ส่งสำเร็จ (Email Sent)
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NotificationHistory;

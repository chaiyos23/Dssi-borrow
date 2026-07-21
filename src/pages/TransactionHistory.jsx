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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Grid
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/analytics/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let params = [];
      if (search) params.push(`search=${search}`);
      if (selectedRoom) params.push(`room_id=${selectedRoom}`);
      if (statusFilter !== 'All') params.push(`status_filter=${statusFilter}`);
      if (overdueOnly) params.push(`overdue_only=true`);
      
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
      
      const response = await axios.get(`${API_BASE_URL}/transactions/history${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลประวัติการทำรายการได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [search, selectedRoom, statusFilter, overdueOnly]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" /> คัดกรองข้อมูลประวัติการทำรายการ
        </Typography>

        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="ค้นหารหัสนักศึกษา"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 0.5 }} />
              }}
              placeholder="รหัสนักศึกษา..."
            />
          </Grid>

          {/* Room Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>กรองตามห้องเก็บอุปกรณ์</InputLabel>
              <Select
                value={selectedRoom}
                label="กรองตามห้องเก็บอุปกรณ์"
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <MenuItem value="">ห้องทั้งหมด</MenuItem>
                {rooms.map((room) => (
                  <MenuItem key={room.room_id} value={room.room_id}>
                    {room.room_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>ประเภทรายการ</InputLabel>
              <Select
                value={statusFilter}
                label="ประเภทรายการ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">รายการทั้งหมด</MenuItem>
                <MenuItem value="Active">กำลังถูกยืม (ยังไม่คืน)</MenuItem>
                <MenuItem value="Returned">ส่งคืนแล้ว</MenuItem>
                <MenuItem value="Damaged">คืนแล้วพบการชำรุด</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Overdue Checkbox */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  color="primary"
                />
              }
              label="แสดงเฉพาะรายการส่งคืนช้า / ค้างส่ง"
            />
          </Grid>
        </Grid>
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
              <TableCell sx={{ fontWeight: 600 }}>วันที่/เวลาทำรายการ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ประเภท</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ห้อง</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>สภาพตอนส่งคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>กำหนดคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>การส่งคืน</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  ไม่พบข้อมูลประวัติการยืม-คืนตามเงื่อนไขที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              history.map((tx) => {
                const isReturned = tx.returned_at !== null;
                const isLate = tx.is_overdue;
                
                return (
                  <TableRow key={tx.transaction_id} hover>
                    <TableCell sx={{ fontSize: 13 }}>
                      {isReturned ? formatDate(tx.returned_at) : formatDate(tx.borrowed_at)}
                    </TableCell>
                    <TableCell>
                      {isReturned ? (
                        <Chip label="คืน" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="ยืม" color="primary" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{tx.user_id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.student_name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.assets_id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.assets_name}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.room_name}</TableCell>
                    <TableCell>
                      {tx.condition_status === "ชำรุด" ? (
                        <Chip label="ชำรุด" color="error" size="small" sx={{ fontWeight: 600 }} />
                      ) : tx.condition_status === "ปกติ" ? (
                        <Chip label="ปกติ" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.return_deadline)}</TableCell>
                    <TableCell>
                      {isReturned ? (
                        isLate ? (
                          <Chip label="คืนล่าช้า" color="warning" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="ตรงเวลา" color="success" size="small" sx={{ fontWeight: 600 }} />
                        )
                      ) : (
                        isLate ? (
                          <Chip label="เกินกำหนด (ค้างส่ง)" color="error" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="กำลังยืม (ปกติ)" color="info" size="small" sx={{ fontWeight: 600 }} />
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransactionHistory;

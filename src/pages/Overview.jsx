import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Inventory as TotalIcon,
  CheckCircle as AvailableIcon,
  SwapHoriz as BorrowedIcon,
  ReportProblem as DamagedIcon,
  MeetingRoom as RoomIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
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
      console.error('Failed to fetch rooms', err);
    }
  };

  const fetchStats = async (roomId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/analytics/overview`;
      if (roomId) {
        url += `?room_id=${roomId}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลสรุปผลได้ กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStats();
  }, []);

  const handleRoomChange = (event) => {
    const val = event.target.value;
    setSelectedRoom(val);
    fetchStats(val);
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'อุปกรณ์ทั้งหมด',
      value: stats?.total_assets ?? 0,
      icon: <TotalIcon sx={{ fontSize: 32 }} />,
      color: '#1a73e8',
      bg: 'linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%)'
    },
    {
      title: 'ว่างพร้อมใช้งาน',
      value: stats?.available_assets ?? 0,
      icon: <AvailableIcon sx={{ fontSize: 32 }} />,
      color: '#137333',
      bg: 'linear-gradient(135deg, #e6f4ea 0%, #ceead6 100%)'
    },
    {
      title: 'กำลังถูกยืม',
      value: stats?.borrowed_assets ?? 0,
      icon: <BorrowedIcon sx={{ fontSize: 32 }} />,
      color: '#b06000',
      bg: 'linear-gradient(135deg, #fef7e0 0%, #feebc8 100%)'
    },
    {
      title: 'ชำรุด/ส่งซ่อม',
      value: stats?.damaged_assets ?? 0,
      icon: <DamagedIcon sx={{ fontSize: 32 }} />,
      color: '#c5221f',
      bg: 'linear-gradient(135deg, #fce8e6 0%, #fad2cf 100%)'
    }
  ];

  // Helper calculation for custom ratio display
  const total = stats?.total_assets || 1;
  const availablePct = Math.round(((stats?.available_assets || 0) / total) * 100);
  const borrowedPct = Math.round(((stats?.borrowed_assets || 0) / total) * 100);
  const damagedPct = Math.round(((stats?.damaged_assets || 0) / total) * 100);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Filters Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon color="primary" /> สถิติจำแนกตามสถานที่เก็บ
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="room-filter-label">กรองตามห้องเก็บอุปกรณ์</InputLabel>
          <Select
            labelId="room-filter-label"
            id="room-filter"
            value={selectedRoom}
            label="กรองตามห้องเก็บอุปกรณ์"
            onChange={handleRoomChange}
          >
            <MenuItem value="">ห้องทั้งหมด</MenuItem>
            {rooms.map((room) => (
              <MenuItem key={room.room_id} value={room.room_id}>
                {room.room_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ background: card.bg, borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.3)', position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {card.title}
                    </Typography>
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: card.color }} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 700, color: card.color }}>
                        {card.value}
                      </Typography>
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.7)', color: card.color, width: 56, height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Custom Visualization Area */}
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          📊 อัตราส่วนสถานะการครอบครองอุปกรณ์
        </Typography>
        
        {/* Progress Ratio Bar */}
        <Box sx={{ width: '100%', height: 28, bgcolor: '#e0e0e0', borderRadius: 14, overflow: 'hidden', display: 'flex', mb: 4 }}>
          {stats?.available_assets > 0 && (
            <Tooltip title={`ว่างพร้อมใช้งาน: ${availablePct}%`}>
              <Box sx={{ width: `${availablePct}%`, bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {availablePct >= 10 ? `${availablePct}%` : ''}
              </Box>
            </Tooltip>
          )}
          {stats?.borrowed_assets > 0 && (
            <Tooltip title={`กำลังถูกยืม: ${borrowedPct}%`}>
              <Box sx={{ width: `${borrowedPct}%`, bgcolor: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {borrowedPct >= 10 ? `${borrowedPct}%` : ''}
              </Box>
            </Tooltip>
          )}
          {stats?.damaged_assets > 0 && (
            <Tooltip title={`ชำรุด/ส่งซ่อม: ${damagedPct}%`}>
              <Box sx={{ width: `${damagedPct}%`, bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {damagedPct >= 10 ? `${damagedPct}%` : ''}
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Legend */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ว่างพร้อมใช้งาน ({stats?.available_assets} รายการ)</Typography>
                <Typography variant="caption" color="text.secondary">อุปกรณ์ที่พร้อมจะทำการสแกนยืมออกได้ทันที</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>กำลังถูกยืม ({stats?.borrowed_assets} รายการ)</Typography>
                <Typography variant="caption" color="text.secondary">อุปกรณ์ที่อยู่ระหว่างการครอบครองของนักศึกษา</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ชำรุด/ส่งซ่อม ({stats?.damaged_assets} รายการ)</Typography>
                <Typography variant="caption" color="text.secondary">อุปกรณ์ที่พัง เสียหาย และอยู่ระหว่างงดให้บริการยืม</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Overview;

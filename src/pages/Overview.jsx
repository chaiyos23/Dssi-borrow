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
import PageHeader from '../components/PageHeader';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Status colors follow the app's semantic palette: green = healthy/available,
  // blue = active/in-use (neutral, not a problem), red = needs attention.
  const statCards = [
    {
      title: 'อุปกรณ์ทั้งหมด',
      value: stats?.total_assets ?? 0,
      icon: <TotalIcon sx={{ fontSize: 26 }} />,
      color: 'text.primary',
      iconBg: 'action.selected'
    },
    {
      title: 'ว่างพร้อมใช้งาน',
      value: stats?.available_assets ?? 0,
      icon: <AvailableIcon sx={{ fontSize: 26 }} />,
      color: 'success.main',
      iconBg: 'success.light'
    },
    {
      title: 'กำลังถูกยืม',
      value: stats?.borrowed_assets ?? 0,
      icon: <BorrowedIcon sx={{ fontSize: 26 }} />,
      color: 'primary.main',
      iconBg: 'primary.light'
    },
    {
      title: 'ชำรุด/ส่งซ่อม',
      value: stats?.damaged_assets ?? 0,
      icon: <DamagedIcon sx={{ fontSize: 26 }} />,
      color: 'error.main',
      iconBg: 'error.light'
    }
  ];

  // backend (analytics.py) ส่งมาแค่ "จำนวนนับ" เท่านั้น (total_assets, available_assets, ...)
  // ไม่มีเปอร์เซ็นต์ติดมาด้วยเลย -> frontend ต้องคำนวณ % เอง 3 บรรทัดนี้

  // || 1 (ไม่ใช่ || 0) กันหารด้วยศูนย์ ถ้า total_assets เป็น 0 จริง (ไม่มีอุปกรณ์เลยในระบบ)
  // เพราะ x/0 ใน JavaScript ได้ Infinity หรือ NaN ทำให้แถบกราฟพัง
  const total = stats?.total_assets || 1;

  // สูตรเปอร์เซ็นต์พื้นฐาน: (จำนวนของสถานะนี้ / จำนวนทั้งหมด) * 100
  // stats?.available_assets || 0 กันกรณี stats ยังเป็น null ตอนหน้ายังโหลดไม่เสร็จ
  // Math.round() ปัดเศษให้เป็นจำนวนเต็ม กันทศนิยมแปลกๆ เช่น 33.333...%
  const availablePct = Math.round(((stats?.available_assets || 0) / total) * 100);
  const borrowedPct = Math.round(((stats?.borrowed_assets || 0) / total) * 100);
  const damagedPct = Math.round(((stats?.damaged_assets || 0) / total) * 100);

  // เอา % ที่คำนวณได้มาเก็บรวมกับข้อมูลแสดงผล (สี, ป้ายชื่อ, คำอธิบาย)
  // แต่ละ object ในนี้จะถูกเอาไปวาดเป็นแถบสีด้วย CSS width: `${pct}%` (ไม่ได้ใช้ library กราฟ)
  const segments = [
    { key: 'available', pct: availablePct, count: stats?.available_assets || 0, color: 'success.main', label: 'ว่างพร้อมใช้งาน', desc: 'อุปกรณ์ที่พร้อมจะทำการสแกนยืมออกได้ทันที' },
    { key: 'borrowed', pct: borrowedPct, count: stats?.borrowed_assets || 0, color: 'primary.main', label: 'กำลังถูกยืม', desc: 'อุปกรณ์ที่อยู่ระหว่างการครอบครองของนักศึกษา' },
    { key: 'damaged', pct: damagedPct, count: stats?.damaged_assets || 0, color: 'error.main', label: 'ชำรุด/ส่งซ่อม', desc: 'อุปกรณ์ที่พัง เสียหาย และอยู่ระหว่างงดให้บริการยืม' }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        icon={<RoomIcon color="primary" />}
        title="แดชบอร์ดสรุปผล"
        subtitle="ภาพรวมสถานะอุปกรณ์ทั้งหมดในระบบ แยกดูตามห้องเก็บอุปกรณ์ได้"
        action={
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
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stat tiles */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.75 }}>
                      {card.title}
                    </Typography>
                    {loading ? (
                      <CircularProgress size={22} sx={{ color: card.color }} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, lineHeight: 1.1 }}>
                        {card.value.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  <Avatar variant="rounded" sx={{ bgcolor: card.iconBg, color: card.color, width: 44, height: 44, borderRadius: 2.5 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Composition meter */}
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          สัดส่วนสถานะการครอบครองอุปกรณ์
        </Typography>

        <Box sx={{ width: '100%', height: 24, bgcolor: 'action.hover', borderRadius: 12, overflow: 'hidden', display: 'flex', gap: '2px', mb: 4 }}>
          {segments.filter((s) => s.pct > 0).map((s) => (
            <Tooltip key={s.key} title={`${s.label}: ${s.pct}% (${s.count} รายการ)`}>
              <Box
                sx={{
                  width: `${s.pct}%`,
                  bgcolor: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'common.white',
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: s.pct > 0 ? 4 : 0,
                  transition: 'width 0.3s'
                }}
              >
                {s.pct >= 10 ? `${s.pct}%` : ''}
              </Box>
            </Tooltip>
          ))}
        </Box>

        <Grid container spacing={2}>
          {segments.map((s) => (
            <Grid size={{ xs: 12, sm: 4 }} key={s.key}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 12, height: 12, mt: 0.4, bgcolor: s.color, borderRadius: 0.5, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {s.label} ({s.count} รายการ)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.desc}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Overview;

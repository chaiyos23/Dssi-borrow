import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  SwapHoriz as ActiveIcon,
  History as HistoryIcon,
  WarningAmber as OverdueIcon,
  NotificationsActive as NotificationIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const userName = localStorage.getItem('name') || 'Admin User';
  const userRole = localStorage.getItem('role') || 'admin';
  const profileImage = localStorage.getItem('profile_image') || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'แดชบอร์ดสรุปผล', icon: <DashboardIcon />, path: '/' },
    { text: 'รายการยืมปัจจุบัน', icon: <ActiveIcon />, path: '/current' },
    { text: 'ประวัติการยืม-คืน', icon: <HistoryIcon />, path: '/history' },
    { text: 'ตรวจสอบรายการค้างส่ง', icon: <OverdueIcon />, path: '/overdue' },
    { text: 'ประวัติการแจ้งเตือน', icon: <NotificationIcon />, path: '/notifications-log' }
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          📦 DSSI Borrow
        </Typography>
      </Toolbar>
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={profileImage} alt={userName} sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
          {userName.charAt(0)}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, noWrap: true }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
            {userRole}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 1 }} />
      
      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : 'rgba(0, 0, 0, 0.04)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.contrastText' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <List sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1.5, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="ออกจากระบบ" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'ระบบยืม-คืนอุปกรณ์'}
          </Typography>

          <Box>
            <Tooltip title="บัญชีผู้ใช้">
              <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
                <Avatar src={profileImage} alt={userName} sx={{ width: 32, height: 32 }}>
                  {userName.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                ออกจากระบบ
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

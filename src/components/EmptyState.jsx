// ข้อความ "ไม่มีข้อมูล" reusable แสดงเวลาตารางว่างเปล่า ใช้ซ้ำทุกหน้าที่มีตาราง

import React from 'react';
import { Box, Typography } from '@mui/material';
import { InboxOutlined as DefaultIcon } from '@mui/icons-material';

/**
 * Consistent "no data" placeholder for tables across the admin pages.
 * Renders inside a <TableCell colSpan={N}>.
 */
const EmptyState = ({ icon, title, description, tone = 'muted' }) => (
  <Box
    sx={{
      py: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      color: tone === 'success' ? 'success.main' : 'text.secondary'
    }}
  >
    <Box sx={{ fontSize: 40, opacity: tone === 'success' ? 1 : 0.45, display: 'flex' }}>
      {icon || <DefaultIcon sx={{ fontSize: 40 }} />}
    </Box>
    <Typography variant="body1" sx={{ fontWeight: 600, color: tone === 'success' ? 'success.main' : 'text.primary' }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" sx={{ color: tone === 'success' ? 'success.main' : 'text.secondary', maxWidth: 380, textAlign: 'center' }}>
        {description}
      </Typography>
    )}
  </Box>
);

export default EmptyState;

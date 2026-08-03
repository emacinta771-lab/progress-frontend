const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================
router.get('/admin', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM students WHERE enrollment_status = 'Active') as active_students,
        (SELECT COUNT(*) FROM teachers WHERE is_active = true) as total_teachers,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM students WHERE financial_hold = true) as financial_holds,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM students) as total_outstanding,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM students) as total_revenue,
        (SELECT COUNT(*) FROM students WHERE user_id IS NULL) as students_without_accounts
    `);
    
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// TEACHER DASHBOARD STATS
// ==========================================
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM students s 
         JOIN classes c ON s.current_standard = c.standard 
         WHERE c.teacher_id = $1) as total_students,
        (SELECT COUNT(*) FROM attendance 
         WHERE teacher_id = $1 AND date = CURRENT_DATE AND status = 'Present') as present_today,
        (SELECT COUNT(*) FROM attendance 
         WHERE teacher_id = $1 AND date = CURRENT_DATE AND status = 'Absent') as absent_today
    `, [teacherId]);
    
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ACCOUNTANT DASHBOARD STATS
// ==========================================
router.get('/accountant', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(amount_paid), 0) FROM students) as total_revenue,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM students) as total_outstanding,
        (SELECT COUNT(*) FROM students WHERE outstanding_balance = 0 AND enrollment_status = 'Active') as paid_students,
        (SELECT COUNT(*) FROM students WHERE financial_hold = true) as financial_holds,
        (SELECT COUNT(*) FROM payments WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days') as payments_this_month,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_income
    `);
    
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching accountant dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// STUDENT DASHBOARD STATS
// ==========================================
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.total_fees, s.amount_paid, s.outstanding_balance,
        (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Present') as present_days,
        (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Absent') as absent_days,
        (SELECT COUNT(*) FROM grades WHERE student_id = s.id) as total_grades
      FROM students s
      WHERE s.student_id = $1
    `, [studentId]);
    
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
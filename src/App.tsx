import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomeScene from './pages/Welcome';
import DashboardScene from './pages/Dashboard';
import WorkspaceScene from './pages/Workspace'; // 1. 引入咱们写好的沙盘文件

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScene />} />
        <Route path="/dashboard" element={<DashboardScene />} />
        {/* 2. 注册沙盘路由！这行极其关键！ */}
        <Route path="/workspace" element={<WorkspaceScene />} />
      </Routes>
    </BrowserRouter>
  );
}
# AeroChrono — GeoFS Flight Timer
AeroChrono is a lightweight GeoFS userscript that adds a polished flight timer console to your screen. Before timing can begin, you must enter both departure and arrival airports using valid 4-character ICAO codes — no route, no timer. The console supports start, pause, resume, and reset, with a live HH:MM:SS display that changes color by state. It includes a collapsible, draggable glassmorphism card, a timestamped log console for every action, and localStorage memory so your airport codes persist across sessions. Flight data can be exported to a readable .json backup and imported later; the file stores the route, timer state, elapsed time, and logs, uses a clear app/version structure for platform recognition, and restores imported running timers as paused so the clock never jumps unexpectedly. It does not touch GeoFS flight physics or internal APIs — it simply gives every flight a clear, deliberate start and a professional timing workflow.


# AeroChrono — GeoFS 飞行计时器

AeroChrono 是一个轻量的 GeoFS 用户脚本，为你的屏幕添加一个精致的飞行计时控制台。开始计时前，你必须输入起飞机场和落地机场，且两者都必须是有效的 4 位 ICAO 代码——没有航线，就不计时。控制台支持开始、暂停、继续和重置，实时 HH:MM:SS 显示会随状态变色。它包含可折叠、可拖拽的毛玻璃卡片，带时间戳的操作日志控制台，以及 localStorage 记忆，让机场代码跨会话保留。飞行数据可导出为可读的 .json 备份并稍后导入；文件保存航线、计时状态、已用时长和日志，采用清晰的 app/version 结构便于平台识别，并将导入的运行中计时恢复为暂停，避免时钟意外跳变。它不触碰 GeoFS 飞行物理或内部 API——只是让每次飞行都有一个清晰、有意的开始和专业的计时流程。

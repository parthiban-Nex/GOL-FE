A production-ready React admin dashboard scaffold built with **Vite**, **React Router**,**Tailwind CSS v4**, and **Axios**.
## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173`)

## Module - Attendance
## Summary of Changes
- Employee under the outlet dropdown selector created for attendance regularisation
- Dedicated OD/DR remarks popup modal implemented in mark attendance.
- Dynamic date range filter with Excel report export functionality.
- Daily mark attendance is one-time only; once submitted for the current day, the row freezes to prevent accidental overwrite.
- Any subsequent modifications after initial submission must be processed via the Regularisation workflow.
- All attendance updates made via Regularisation immediately sync and reflect across the mark list, analytics chart, and details table.

#initial commit

## GRn Changes

Created Direct grn 
1) listing grn screen
2) add grn modal
3) filter modal
4) edit grn modal
5) bulk create grn modal
6) grn pdf creation
7) grn view modal

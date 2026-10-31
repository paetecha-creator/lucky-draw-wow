import * as XLSX from 'xlsx';
import { AttendeeRegistration, EmployeeRoster, LuckyDrawRecord } from '../types/party';

// Normalize header key for flexible recognition
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s\-_/]/g, '');
}

export function parseEmployeeExcel(fileBuffer: ArrayBuffer): EmployeeRoster[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel นี้');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('ไฟล์ Excel ไม่มีข้อมูลแถวพนักงาน');
  }

  const parsedList: EmployeeRoster[] = [];

  rawRows.forEach((row, index) => {
    let id = '';
    let fullName = '';
    let nickname = '';
    let department = '';
    let tableNumber = '';
    let groupRole = 'พนักงานทั่วไป';
    let phone = '';
    let isBlockedFromDraw = false;

    // Scan all properties in the row with fuzzy Thai & English header detection
    for (const [key, val] of Object.entries(row)) {
      const norm = normalizeKey(key);
      const strVal = String(val ?? '').trim();

      if (
        norm.includes('รหัส') ||
        norm.includes('employeeid') ||
        norm.includes('empid') ||
        norm.includes('emp_id') ||
        norm === 'id'
      ) {
        if (!id) id = strVal;
      } else if (
        norm.includes('ชื่อนามสกุล') ||
        norm.includes('fullname') ||
        norm.includes('name') ||
        norm.includes('ชื่อจริง') ||
        (norm.includes('ชื่อ') && !norm.includes('เล่น'))
      ) {
        if (!fullName) fullName = strVal;
      } else if (norm.includes('ชื่อเล่น') || norm.includes('nickname') || norm.includes('nick')) {
        if (!nickname) nickname = strVal;
      } else if (
        norm.includes('แผนก') ||
        norm.includes('ฝ่าย') ||
        norm.includes('สังกัด') ||
        norm.includes('department') ||
        norm.includes('dept')
      ) {
        if (!department) department = strVal;
      } else if (
        norm.includes('โต๊ะ') ||
        norm.includes('หมายเลขโต๊ะ') ||
        norm.includes('table') ||
        norm.includes('seat') ||
        norm.includes('เบอร์โต๊ะ')
      ) {
        if (!tableNumber) tableNumber = strVal;
      } else if (
        norm.includes('กลุ่ม') ||
        norm.includes('บทบาท') ||
        norm.includes('role') ||
        norm.includes('group') ||
        norm.includes('ตำแหน่ง')
      ) {
        if (strVal) groupRole = strVal;
      } else if (norm.includes('เบอร์') || norm.includes('โทร') || norm.includes('phone') || norm.includes('mobile')) {
        if (!phone) phone = strVal;
      } else if (
        norm.includes('บล็อค') ||
        norm.includes('ยกเว้น') ||
        norm.includes('block') ||
        norm.includes('exclude')
      ) {
        const lower = strVal.toLowerCase();
        isBlockedFromDraw = lower === 'true' || lower === 'yes' || lower === '1' || strVal === 'ใช่' || strVal === 'บล็อค';
      }
    }

    // Fallbacks if no header matched directly
    if (!id) {
      id = `EMP-${String(index + 1).padStart(4, '0')}`;
    }
    if (!fullName) {
      fullName = `พนักงานลำดับที่ ${index + 1}`;
    }
    if (!department) {
      department = 'ทั่วไป';
    }
    if (!tableNumber) {
      tableNumber = 'โต๊ะกลาง (รอจัดสรร)';
    }

    parsedList.push({
      id,
      fullName,
      nickname,
      department,
      tableNumber,
      groupRole,
      phone,
      isBlockedFromDraw,
    });
  });

  return parsedList;
}

// Download Sample Template for Admin to fill in
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'รหัสพนักงาน': 'EMP-1001',
      'ชื่อ-นามสกุล': 'กิตติศักดิ์ เจริญพร',
      'ชื่อเล่น': 'บอย',
      'แผนก': 'เทคโนโลยีสารสนเทศ (IT)',
      'หมายเลขโต๊ะ': 'โต๊ะ 01 (โซนเวที)',
      'กลุ่ม/บทบาท': 'พนักงานทั่วไป',
      'เบอร์โทร': '081-234-5678',
      'บล็อคการสุ่มรางวัล (ใช่/ไม่ใช่)': 'ไม่ใช่',
    },
    {
      'รหัสพนักงาน': 'EMP-1002',
      'ชื่อ-นามสกุล': 'ณัฐนันท์ วงศ์สุวรรณ',
      'ชื่อเล่น': 'แพรว',
      'แผนก': 'ฝ่ายการตลาด (Marketing)',
      'หมายเลขโต๊ะ': 'โต๊ะ 01 (โซนเวที)',
      'กลุ่ม/บทบาท': 'พนักงานทั่วไป',
      'เบอร์โทร': '082-345-6789',
      'บล็อคการสุ่มรางวัล (ใช่/ไม่ใช่)': 'ไม่ใช่',
    },
    {
      'รหัสพนักงาน': 'EMP-1003',
      'ชื่อ-นามสกุล': 'สมชาย รักชาติยิ่ง',
      'ชื่อเล่น': 'ต่อ',
      'แผนก': 'ฝ่ายบริหาร (Executive)',
      'หมายเลขโต๊ะ': 'โต๊ะ 06 (โซน VIP)',
      'กลุ่ม/บทบาท': 'ผู้บริหาร/กรรมการ',
      'เบอร์โทร': '083-456-7890',
      'บล็อคการสุ่มรางวัล (ใช่/ไม่ใช่)': 'ใช่',
    },
    {
      'รหัสพนักงาน': 'EMP-1004',
      'ชื่อ-นามสกุล': 'พิมพิลาไลย ศรีสวัสดิ์',
      'ชื่อเล่น': 'เบลล่า',
      'แผนก': 'ทรัพยากรบุคคล (HR)',
      'หมายเลขโต๊ะ': 'โต๊ะ 02 (โซนดนตรี)',
      'กลุ่ม/บทบาท': 'ทีมงานจัดเลี้ยง',
      'เบอร์โทร': '084-567-8901',
      'บล็อคการสุ่มรางวัล (ใช่/ไม่ใช่)': 'ไม่ใช่',
    },
    {
      'รหัสพนักงาน': 'EMP-1005',
      'ชื่อ-นามสกุล': 'อัครเดช รัตนเกียรติ',
      'ชื่อเล่น': 'กอล์ฟ',
      'แผนก': 'ฝ่ายขายและการพาณิชย์ (Sales)',
      'หมายเลขโต๊ะ': 'โต๊ะ 03 (โซนปาร์ตี้บาร์)',
      'กลุ่ม/บทบาท': 'พนักงานทั่วไป',
      'เบอร์โทร': '085-678-9012',
      'บล็อคการสุ่มรางวัล (ใช่/ไม่ใช่)': 'ไม่ใช่',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อพนักงานและโต๊ะ');
  XLSX.writeFile(workbook, 'Template_รายชื่อพนักงานและเลขโต๊ะ.xlsx');
}

// Export All Registered Attendees to Excel
export function exportAttendeesToExcel(
  attendees: AttendeeRegistration[],
  luckyWinners: LuckyDrawRecord[]
) {
  // Map winner prize lookup
  const winnerMap = new Map<string, string>();
  luckyWinners.forEach((w) => {
    winnerMap.set(w.employeeId, `${w.prizeName} (${w.prizeTier})`);
  });

  const exportRows = attendees.map((att, idx) => {
    const regDate = new Date(att.registeredAt);
    const formattedDate = !isNaN(regDate.getTime())
      ? regDate.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : att.registeredAt;

    return {
      'ลำดับ': idx + 1,
      'รหัสพนักงาน': att.employeeId,
      'ชื่อ-นามสกุล': att.fullName,
      'ชื่อเล่น': att.nickname || '-',
      'แผนก': att.department,
      'หมายเลขโต๊ะ': att.tableNumber,
      'กลุ่ม/บทบาท': att.groupRole || 'พนักงานทั่วไป',
      'เบอร์โทรศัพท์': att.phone || '-',
      'เวลาลงทะเบียน': formattedDate,
      'สถานะการเซลฟี่': att.selfieUrl ? 'มีภาพเซลฟี่เรียบร้อย' : 'ไม่มีภาพ',
      'รางวัล Lucky Draw ที่ได้รับ': winnerMap.get(att.employeeId) || 'ยังไม่ได้รับรางวัล',
      'หมายเหตุ/อาหาร': att.dietaryOrNote || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 26 },
    { wch: 12 },
    { wch: 26 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 35 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'สรุปผลลงทะเบียนเข้างาน');
  const now = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `สรุปการลงทะเบียนงานเลี้ยง_${now}.xlsx`);
}

// Export Lucky Draw Winners Report to Excel
export function exportLuckyDrawReportToExcel(winners: LuckyDrawRecord[]) {
  const exportRows = winners.map((record, idx) => {
    const drawDate = new Date(record.wonAt);
    const formattedDate = !isNaN(drawDate.getTime())
      ? drawDate.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : record.wonAt;

    return {
      'ลำดับที่': idx + 1,
      'รอบการสุ่ม': `รอบที่ ${record.round}`,
      'ชื่อรางวัล': record.prizeName,
      'ระดับรางวัล': record.prizeTier,
      'รหัสพนักงานผู้โชคดี': record.employeeId,
      'ชื่อ-นามสกุล': record.winnerName,
      'ชื่อเล่น': record.nickname || '-',
      'แผนก': record.department,
      'หมายเลขโต๊ะ': record.tableNumber,
      'วัน-เวลาที่จับรางวัล': formattedDate,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 30 },
    { wch: 25 },
    { wch: 18 },
    { wch: 26 },
    { wch: 12 },
    { wch: 26 },
    { wch: 20 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติผู้ได้รับรางวัล');
  const now = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `รายงานผลสุ่มจับรางวัล_${now}.xlsx`);
}

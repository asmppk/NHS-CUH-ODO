import React, { useState, useMemo } from 'react';
import { Calendar, Download, RefreshCw, Users, TrendingUp, User } from 'lucide-react';

export default function FactorySchedule() {
  const [seed, setSeed] = useState(Date.now());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedEmployee, setSelectedEmployee] = useState('e1');

  const employees = [
    { id: 'e1', name: 'e1', baseDays: [1, 2, 3], color: '#3B82F6', targetHours: 1950 },
    { id: 'e2', name: 'e2', baseDays: [1, 3, 4], color: '#10B981', targetHours: 1950 },
    { id: 'e3', name: 'e3', baseDays: [2, 4, 5], color: '#F59E0B', targetHours: 1950 },
    { id: 'e4', name: 'e4', baseDays: [3, 4, 5], color: '#8B5CF6', targetHours: 1950 },
    { id: 'e5', name: 'e5', baseDays: [1, 2, 5], color: '#EC4899', targetHours: 1950 },
    { id: 'e6', name: 'e6', baseDays: [4, 5, 6], color: '#EF4444', targetHours: 1950 },
    { id: 'e7', name: 'e7', baseDays: [2, 4, 0], color: '#06B6D4', targetHours: 1950 }
  ];

  const months = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];

  const dayNames = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  const dayNamesFull = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

  const seededRandom = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  function getDateFromWeek(year, week, dayOfWeek) {
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7 + dayOfWeek - jan1.getDay();
    return new Date(year, 0, 1 + daysToAdd);
  }

  const yearlySchedule = useMemo(() => {
    let currentSeed = seed;
    const getRandom = () => {
      currentSeed++;
      return seededRandom(currentSeed);
    };

    const schedule = [];
    const employeeStats = employees.map(emp => ({
      ...emp,
      hoursWorked: 0,
      regularDays: 0,
      extraDays: 0,
      workDays: []
    }));

    const baseWeeklyHours = employees.map(emp => {
      let hours = 0;
      emp.baseDays.forEach(day => {
        hours += (day >= 1 && day <= 5) ? 12 : 11;
      });
      return hours;
    });

    const weeksInYear = 52;
    const extraDaysNeeded = employees.map((emp, idx) => {
      const baseAnnualHours = baseWeeklyHours[idx] * weeksInYear;
      const deficit = emp.targetHours - baseAnnualHours;
      return Math.ceil(deficit / 12);
    });

    const extraDaysAssigned = employees.map(() => 0);

    for (let week = 1; week <= weeksInYear; week++) {
      const weekSchedule = { week, days: [] };
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = getDateFromWeek(2026, week, dayOfWeek);
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        const shift = {
          date,
          dayName: dayNames[dayOfWeek],
          employees: [],
          hours: isWeekday ? 12 : 11
        };

        employees.forEach((emp, empIdx) => {
          if (emp.baseDays.includes(dayOfWeek)) {
            shift.employees.push({ ...emp, status: 'work', isRegular: true });
            employeeStats[empIdx].hoursWorked += shift.hours;
            employeeStats[empIdx].regularDays += 1;
            employeeStats[empIdx].workDays.push({
              date: new Date(date),
              hours: shift.hours,
              status: 'work'
            });
          }
        });

        if (isWeekday) {
          employees.forEach((emp, empIdx) => {
            const needsExtra = extraDaysAssigned[empIdx] < extraDaysNeeded[empIdx];
            const currentProgress = week / weeksInYear;
            const targetProgress = extraDaysNeeded[empIdx] > 0 
              ? extraDaysAssigned[empIdx] / extraDaysNeeded[empIdx] 
              : 1;
            
            if (needsExtra && currentProgress > targetProgress) {
              const alreadyWorking = shift.employees.find(e => e.id === emp.id);
              if (!alreadyWorking) {
                const urgency = (currentProgress - targetProgress) * 2;
                if (getRandom() < urgency) {
                  shift.employees.push({ ...emp, status: 'extra', isRegular: false });
                  employeeStats[empIdx].hoursWorked += shift.hours;
                  employeeStats[empIdx].extraDays += 1;
                  employeeStats[empIdx].workDays.push({
                    date: new Date(date),
                    hours: shift.hours,
                    status: 'extra'
                  });
                  extraDaysAssigned[empIdx] += 1;
                }
              }
            }
          });
        }

        weekSchedule.days.push(shift);
      }
      
      schedule.push(weekSchedule);
    }

    employees.forEach((emp, empIdx) => {
      const deficit = emp.targetHours - employeeStats[empIdx].hoursWorked;
      
      if (deficit > 10) {
        const lastWeeks = schedule.slice(-4);
        let remainingDeficit = deficit;
        
        for (let week of lastWeeks) {
          if (remainingDeficit <= 0) break;
          
          for (let day of week.days) {
            if (remainingDeficit <= 0) break;
            
            const isWeekday = day.date.getDay() >= 1 && day.date.getDay() <= 5;
            if (!isWeekday) continue;
            
            const alreadyWorking = day.employees.find(e => e.id === emp.id);
            if (alreadyWorking) continue;
            
            const hoursToAdd = Math.min(remainingDeficit, 12);
            day.employees.push({ 
              ...emp, 
              status: 'extra', 
              isRegular: false,
              partialHours: hoursToAdd < 12 ? hoursToAdd : null
            });
            employeeStats[empIdx].hoursWorked += hoursToAdd;
            employeeStats[empIdx].extraDays += hoursToAdd / 12;
            employeeStats[empIdx].workDays.push({
              date: new Date(day.date),
              hours: hoursToAdd,
              status: 'extra',
              partial: hoursToAdd < 12
            });
            remainingDeficit -= hoursToAdd;
          }
        }
      }
    });

    return { schedule, employeeStats };
  }, [seed]);

  const monthSchedule = useMemo(() => {
    return yearlySchedule.schedule.filter(week => {
      const firstDay = week.days[0].date;
      return firstDay.getMonth() === selectedMonth;
    });
  }, [yearlySchedule.schedule, selectedMonth]);

  const employeeMonthSchedule = useMemo(() => {
    const emp = yearlySchedule.employeeStats.find(e => e.id === selectedEmployee);
    if (!emp) return [];
    
    return emp.workDays.filter(day => day.date.getMonth() === selectedMonth);
  }, [yearlySchedule, selectedEmployee, selectedMonth]);

  const exportToCSV = () => {
    let csv = 'Week,Date,Day,e1,e2,e3,e4,e5,e6,e7,Coverage\n';
    
    yearlySchedule.schedule.forEach(week => {
      week.days.forEach(day => {
        const dateStr = day.date.toLocaleDateString('el-GR');
        const empStatus = employees.map(emp => {
          const assigned = day.employees.find(e => e.id === emp.id);
          if (!assigned) return '-';
          if (assigned.status === 'extra') {
            return assigned.partialHours ? `ΕΠΙΠΛΕΟΝ (${assigned.partialHours}h)` : 'ΕΠΙΠΛΕΟΝ';
          }
          return 'ΕΡΓΑΣΙΑ';
        });
        const coverage = day.employees.length;
        csv += `${week.week},${dateStr},${day.dayName},${empStatus.join(',')},${coverage}\n`;
      });
    });

    csv += '\n\nΣΥΝΟΠΤΙΚΑ\n';
    csv += 'Εργαζόμενος,Ημέρες,Επιπλέον,Ώρες,Στόχος,Διαφορά\n';
    yearlySchedule.employeeStats.forEach(emp => {
      const deficit = emp.targetHours - emp.hoursWorked;
      csv += `${emp.name},"${emp.baseDays.map(d => dayNames[d]).join(', ')}",${emp.extraDays.toFixed(1)},${emp.hoursWorked.toFixed(0)},${emp.targetHours},${deficit.toFixed(0)}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'schedule_2026.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Ετήσιο Πρόγραμμα 2026</h1>
                <p className="text-sm text-gray-600">7 εργαζόμενοι × 1,950h/έτος</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSeed(Date.now())}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4" />
                Νέο
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Ημερολόγιο
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                viewMode === 'employee' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Ανά Εργαζόμενο
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {months.map((month, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMonth(idx)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedMonth === idx ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Στατιστικά - Στόχος: 1,950h
          </h2>
          <div className="grid grid-cols-7 gap-3">
            {yearlySchedule.employeeStats.map((emp) => {
              const deficit = emp.targetHours - emp.hoursWorked;
              const isOnTarget = Math.abs(deficit) < 6;
              const percentComplete = (emp.hoursWorked / emp.targetHours) * 100;
              
              return (
                <div 
                  key={emp.id} 
                  className={`p-3 rounded-lg border-2 cursor-pointer ${
                    isOnTarget ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
                  } ${viewMode === 'employee' && selectedEmployee === emp.id ? 'ring-4 ring-indigo-300' : ''}`}
                  style={{ borderColor: emp.color }}
                  onClick={() => {
                    setSelectedEmployee(emp.id);
                    setViewMode('employee');
                  }}
                >
                  <div className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                    <span>{emp.name}</span>
                    {isOnTarget && <span className="text-green-600">✓</span>}
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ώρες:</span>
                      <span className="font-bold text-indigo-600">{emp.hoursWorked.toFixed(0)}h</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${isOnTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(percentComplete, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2 pt-1 border-t">
                      {emp.baseDays.map(d => dayNames[d]).join(', ')}
                      {emp.extraDays > 0 && <span className="text-orange-600"> +{emp.extraDays.toFixed(0)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {months[selectedMonth]} 2026
            </h2>
            
            <div className="space-y-4">
              {monthSchedule.map(week => (
                <div key={week.week} className="border rounded-lg p-4">
                  <div className="font-semibold text-gray-700 mb-3">Εβδομάδα {week.week}</div>
                  <div className="grid grid-cols-7 gap-2">
                    {week.days.map((day, dayIdx) => {
                      const hasExtra = day.employees.some(e => e.status === 'extra');
                      const isWeekday = day.date.getDay() >= 1 && day.date.getDay() <= 5;
                      const required = isWeekday ? 3 : 1;
                      const hasEnough = day.employees.length >= required;
                      
                      return (
                        <div
                          key={dayIdx}
                          className={`p-3 rounded border-2 ${
                            hasEnough ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                          } ${hasExtra ? 'ring-2 ring-orange-400' : ''}`}
                        >
                          <div className="font-semibold text-sm text-gray-700 mb-1">
                            {day.dayName} {day.date.getDate()}/{day.date.getMonth() + 1}
                            {hasExtra && <span className="ml-1">⭐</span>}
                          </div>
                          <div className="text-xs space-y-1">
                            {day.employees.map((emp, empIdx) => (
                              <div
                                key={empIdx}
                                className="px-2 py-1 rounded text-white font-medium"
                                style={{ backgroundColor: emp.color }}
                              >
                                {emp.name} {emp.status === 'extra' ? '⭐' : ''}
                              </div>
                            ))}
                            <div className={`text-xs font-semibold mt-2 ${hasEnough ? 'text-green-700' : 'text-red-700'}`}>
                              {day.employees.length}/{required}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'employee' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedEmployee} - {months[selectedMonth]} 2026
              </h2>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNamesFull.map((day, idx) => (
                <div key={idx} className="text-center font-semibold text-gray-700 p-2 bg-gray-100 rounded">
                  {dayNames[idx]}
                </div>
              ))}

              {(() => {
                const firstDay = new Date(2026, selectedMonth, 1);
                const lastDay = new Date(2026, selectedMonth + 1, 0);
                const startPadding = firstDay.getDay();
                const days = [];

                for (let i = 0; i < startPadding; i++) {
                  days.push(<div key={`pad-${i}`} className="p-4"></div>);
                }

                for (let day = 1; day <= lastDay.getDate(); day++) {
                  const date = new Date(2026, selectedMonth, day);
                  const workDay = employeeMonthSchedule.find(wd => wd.date.getDate() === day);
                  const empData = yearlySchedule.employeeStats.find(e => e.id === selectedEmployee);

                  days.push(
                    <div
                      key={day}
                      className={`p-4 rounded-lg border-2 min-h-24 ${
                        workDay 
                          ? workDay.status === 'extra'
                            ? 'bg-orange-50 border-orange-400'
                            : 'bg-indigo-50 border-indigo-400'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      style={workDay ? { borderColor: empData.color } : {}}
                    >
                      <div className="font-semibold text-gray-700 mb-2">{day}</div>
                      {workDay && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            {workDay.status === 'extra' ? '⭐ Επιπλέον' : '📅 Εργασία'}
                          </div>
                          <div className="text-sm font-semibold" style={{ color: empData.color }}>
                            {workDay.hours}h
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return days;
              })()}
            </div>

            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Σύνοψη Μήνα</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ημέρες:</span>
                  <span className="font-semibold ml-2">{employeeMonthSchedule.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ώρες:</span>
                  <span className="font-semibold ml-2">
                    {employeeMonthSchedule.reduce((sum, d) => sum + d.hours, 0)}h
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Επιπλέον:</span>
                  <span className="font-semibold ml-2 text-orange-600">
                    {employeeMonthSchedule.filter(d => d.status === 'extra').length} από {yearlySchedule.employeeStats.find(e => e.id === selectedEmployee)?.extraDays.toFixed(1) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Υπόμνημα</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-2">Εργαζόμενοι:</div>
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: emp.color }}></div>
                  <span>{emp.name}: {emp.baseDays.map(d => dayNames[d]).join(', ')}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Κάλυψη:</div>
              <div className="space-y-1 text-xs">
                <div>Δευ: 3 (e1,e2,e5)</div>
                <div>Τρι: 4 (e1,e3,e5,e7)</div>
                <div>Τετ: 3 (e1,e2,e4)</div>
                <div>Πεμ: 5 (e2,e3,e4,e6,e7)</div>
                <div>Παρ: 4 (e3,e4,e5,e6)</div>
                <div>Σαβ: 1 (e6)</div>
                <div>Κυρ: 1 (e7)</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Σύμβολα:</div>
              <div className="space-y-1">
                <div>📅 Κανονική εργασία</div>
                <div>⭐ Επιπλέον ημέρα</div>
                <div>✓ Στόχος OK</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
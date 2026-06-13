import React from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { vi } from 'date-fns/locale';

export default function CustomDateRangePicker({ dateRange, onChange, minDate }) {
    return (
        <div className="flex justify-center border border-[#eaeaea] rounded-xl overflow-hidden bg-white p-2 shadow-sm w-full custom-date-range">
            <style>
                {`
                .custom-date-range {
                    border: 2px solid #ffe4e6;
                    box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.15);
                    border-radius: 16px;
                }
                .custom-date-range .rdrCalendarWrapper {
                    width: 100%;
                    background: transparent;
                }
                .custom-date-range .rdrMonthAndYearWrapper {
                    background: linear-gradient(135deg, #f43f5e 0%, #f97316 100%);
                    border-radius: 12px;
                    padding: 10px;
                    margin-bottom: 12px;
                }
                .custom-date-range .rdrMonthAndYearPickers select {
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                }
                .custom-date-range .rdrMonthAndYearPickers select option {
                    color: #333;
                }
                .custom-date-range .rdrNextPrevButton {
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 8px;
                }
                .custom-date-range .rdrNextPrevButton:hover {
                    background: rgba(255, 255, 255, 0.4);
                }
                .custom-date-range .rdrNextPrevButton i {
                    border-color: white;
                }
                .custom-date-range .rdrMonth {
                    width: 100%;
                    padding: 0;
                }
                .custom-date-range .rdrWeekDay {
                    color: #f43f5e;
                    font-weight: 800;
                    font-size: 14px;
                }
                .custom-date-range .rdrDayToday .rdrDayNumber span:after {
                    background: #f43f5e;
                    bottom: 2px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .custom-date-range .rdrDayNumber {
                    font-weight: 600;
                    color: #444;
                }
                .custom-date-range .rdrDayStartEdge, 
                .custom-date-range .rdrDayEndEdge {
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(244, 63, 94, 0.4);
                }
                .custom-date-range .rdrDayInRange {
                    background: rgba(244, 63, 94, 0.12) !important;
                }
                .custom-date-range .rdrDay:hover .rdrDayNumber {
                    background: #ffe4e6;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                `}
            </style>
            <DateRange
                ranges={dateRange}
                onChange={onChange}
                minDate={minDate}
                rangeColors={['#f43f5e']}
                months={1}
                direction="horizontal"
                showDateDisplay={false}
                locale={vi}
                className="w-full !font-sans"
                moveRangeOnFirstSelection={false}
            />
        </div>
    );
}
import React, { useState, useMemo } from 'react';
import { FormType, PatientRecord, RecordStatus } from '../types';
import { FORM_CONFIGS } from '../utils/storage';
import { downloadRecordHtml } from '../utils/htmlExport';
import {
  ArrowLeft,
  Plus,
  Search,
  Download,
  Trash2,
  FileCode,
  FileText,
  ChevronRight,
  Edit2,
  CheckSquare,
  Square,
  ExternalLink,
  Archive,
} from 'lucide-react';

interface FormListViewProps {
  formType: FormType;
  records: PatientRecord[];
  onBackToDashboard: () => void;
  onNewPatient: (type: FormType) => void;
  onEditRecord: (record: PatientRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onDownloadPdf: (record: PatientRecord) => void;
  onBulkZip: (selectedRecords: PatientRecord[]) => void;
}

type TabFilter = 'all' | FormType;

export const FormListView: React.FC<FormListViewProps> = ({
  formType,
  records,
  onBackToDashboard,
  onNewPatient,
  onEditRecord,
  onDeleteRecord,
  onDownloadPdf,
  onBulkZip,
}) => {
  const [currentTab, setCurrentTab] = useState<TabFilter>(formType || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter records by selected category tab & search query
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (currentTab !== 'all' && r.formType !== currentTab) return false;
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          (r.patientName && r.patientName.toLowerCase().includes(term)) ||
          (r.patientId && r.patientId.toLowerCase().includes(term)) ||
          (r.data?.ipNo && String(r.data.ipNo).toLowerCase().includes(term)) ||
          (r.data?.diagnosis && r.data.diagnosis.toLowerCase().includes(term)) ||
          (r.data?.bedNo && String(r.data.bedNo).toLowerCase().includes(term))
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [records, currentTab, searchTerm]);

  const toggleSelectRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const selectedRecordsList = useMemo(() => {
    return records.filter((r) => selectedIds.has(r.id));
  }, [records, selectedIds]);

  const getFormLabel = (type: FormType) => {
    switch (type) {
      case 'adult':
        return 'Adult Data Sheet';
      case 'pediatric':
        return 'Pediatric Data Sheet';
      case 'ecmo':
        return 'ECMO Data Sheet';
      case 'iabp':
        return 'IABP Data Sheet';
      default:
        return 'Clinical Sheet';
    }
  };

  const renderStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#d0e1fb] text-[#004ac6] text-xs font-semibold">
            Completed
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#e2e7ff] text-[#131b2e] text-xs font-semibold">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen text-[#131b2e] font-sans antialiased py-6 sm:py-8">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Back to Dashboard link */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="text-xs font-semibold text-[#434655] hover:text-[#004ac6] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={() => onNewPatient(currentTab === 'all' ? 'adult' : currentTab)}
            className="bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#003ea8] text-white text-xs sm:text-sm font-semibold px-4 h-[38px] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Patient Form</span>
          </button>
        </div>

        {/* Header & Search Section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">Patients</h1>
            <p className="text-xs text-[#434655] mt-1 font-medium">
              {filteredRecords.length} clinical record{filteredRecords.length === 1 ? '' : 's'} registered
            </p>
          </div>

          <div className="w-full md:w-96 relative bg-white border border-[#C3C6D7] rounded-lg medical-glow transition-all">
            <Search className="w-4 h-4 text-[#737686] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, IP No., or Bed..."
              className="w-full h-[42px] pl-10 pr-4 bg-transparent border-none focus:outline-none text-sm text-[#131b2e] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Filters and Bulk Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {(['all', 'adult', 'pediatric', 'ecmo', 'iabp'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors shrink-0 cursor-pointer ${
                  currentTab === tab
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-white text-[#434655] hover:bg-[#F2F3FF] border border-[#E2E8F0]'
                }`}
              >
                {tab === 'all' ? 'All Records' : tab === 'ecmo' ? 'ECMO' : tab === 'iabp' ? 'IABP' : tab}
              </button>
            ))}
          </div>

          {/* Bulk Selection Actions */}
          {selectedRecordsList.length > 0 && (
            <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-[#004ac6] shadow-xs animate-in fade-in">
              <span className="text-xs font-bold text-[#004ac6]">
                {selectedRecordsList.length} selected
              </span>
              <button
                onClick={() => onBulkZip(selectedRecordsList)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-[#004ac6] text-white rounded hover:bg-[#2563eb] cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Export ZIP</span>
              </button>
            </div>
          )}
        </div>

        {/* Data Table Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-semibold text-[#131b2e]">No patient records found</p>
              <p className="text-xs text-[#737686]">
                {searchTerm
                  ? `No patients match "${searchTerm}". Try another search term.`
                  : 'Start by creating your first patient clinical sheet.'}
              </p>
              <button
                onClick={() => onNewPatient(currentTab === 'all' ? 'adult' : currentTab)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#004ac6] text-white text-xs font-bold rounded-lg hover:bg-[#2563eb]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Patient</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8FF] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 w-[40px]">
                      <button
                        onClick={toggleSelectAll}
                        className="text-[#737686] hover:text-[#131b2e] cursor-pointer flex items-center"
                        title="Select All"
                      >
                        {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#004ac6]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider hidden md:table-cell">
                      Form Type
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#131b2e]">
                  {filteredRecords.map((record) => {
                    const isSelected = selectedIds.has(record.id);
                    const ipNo = record.data?.ipNo || record.patientId;
                    const bedNo = record.data?.bedNo ? `· Bed ${record.data.bedNo}` : '';
                    const dateStr = record.data?.date || (record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Recent');

                    return (
                      <tr
                        key={record.id}
                        onClick={() => onEditRecord(record)}
                        className={`hover:bg-[#F2F3FF] transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[#F2F3FF]/70' : ''
                        }`}
                      >
                        {/* Select Checkbox */}
                        <td className="py-3 px-4" onClick={(e) => toggleSelectRecord(record.id, e)}>
                          <button className="text-[#737686] group-hover:text-[#004ac6] cursor-pointer">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#004ac6]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Patient Name + IP Info */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#131b2e] group-hover:text-[#004ac6] transition-colors">
                            {record.patientName || 'Untitled Patient'}
                          </div>
                          <div className="text-xs text-[#434655] mt-0.5">
                            IP: {ipNo} {bedNo}
                          </div>
                        </td>

                        {/* Form Type */}
                        <td className="py-3 px-4 hidden md:table-cell text-xs text-[#434655]">
                          {getFormLabel(record.formType)}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 hidden sm:table-cell text-xs text-[#737686]">
                          {dateStr}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {renderStatusBadge(record.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Download HTML Button */}
                            <button
                              type="button"
                              onClick={() => downloadRecordHtml(record)}
                              className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-white rounded-md transition-colors"
                              title="Download Standalone HTML Form"
                            >
                              <FileCode className="w-4 h-4" />
                            </button>

                            {/* Download PDF Button */}
                            <button
                              type="button"
                              onClick={() => onDownloadPdf(record)}
                              className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-white rounded-md transition-colors"
                              title="Download PDF Form"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Google Drive Link if synced */}
                            {record.drivePdfUrl && (
                              <a
                                href={record.drivePdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => onEditRecord(record)}
                              className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-white rounded-md transition-colors"
                              title="Edit Form"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(record.id)}
                              className="p-1.5 text-[#ba1a1a] hover:bg-[#FFDAD6] rounded-md transition-colors"
                              title="Delete Form"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Row Arrow */}
                            <ChevronRight className="w-4 h-4 text-[#C3C6D7] group-hover:text-[#004ac6] ml-1" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

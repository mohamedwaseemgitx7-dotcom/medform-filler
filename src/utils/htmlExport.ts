import { PatientRecord, FormType, AdultFormData, PediatricFormData, EcmoFormData, IabpFormData } from '../types';
import { collectFormData } from './storage';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Reusable Core Renderer:
 * FORM TEMPLATE + SAVED FORM DATA -> renderExactForm(templateId, formData) -> COMPLETE POPULATED HTML
 * Guaranteed single source of truth for: Single Download, Bulk ZIP, Drive Save, Print Preview.
 */
export function renderExactForm(
  templateId: FormType,
  formData: any,
  patientId = 'MF-RECORD',
  patientName = ''
): string {
  const data = collectFormData(templateId, formData);
  const effectivePatientName = patientName || data.patientName || '';

  const title =
    templateId === 'adult'
      ? 'ADULT DATA SHEET'
      : templateId === 'pediatric'
      ? 'PEDIATRIC DATA SHEET'
      : templateId === 'ecmo'
      ? 'ECMO DATA SHEET'
      : 'IABP DATA SHEET';

  const v = (val: any) => (val !== undefined && val !== null ? String(val) : '');

  // Blood gas / Telemetry table rows for Adult / Pediatric
  const bloodGasRows = (data as AdultFormData | PediatricFormData).bloodGasRows || [];
  // ECMO rows
  const ecmoRows = (data as EcmoFormData).ecmoRows || [];
  // IABP rows
  const iabpRows = (data as IabpFormData).iabpRows || [];
  const labRows = (data as IabpFormData).labRows || [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${effectivePatientName || patientId}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background-color: #f1f5f9;
      padding: 20px;
      color: #000;
    }
    .page-container {
      background-color: #fff;
      max-width: 960px;
      margin: 0 auto;
      padding: 30px 40px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .actions-bar {
      max-width: 960px;
      margin: 0 auto 15px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #0f172a;
      color: #fff;
      border-radius: 8px;
    }
    .btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #334155;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .btn-success {
      background: #059669;
    }
    .btn-success:hover {
      background: #047857;
    }

    h1.sheet-title {
      text-align: center;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .ecmo-mode-bar {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    table.form-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      table-layout: fixed;
    }
    table.form-table td, table.form-table th {
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 11px;
      vertical-align: middle;
    }
    table.form-table th {
      background-color: #fff;
      font-weight: 600;
      text-align: center;
    }
    .lbl {
      font-weight: 600;
      white-space: nowrap;
    }
    input.cell-input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 11px;
      color: #000;
      font-weight: 500;
      padding: 1px 2px;
    }
    input.cell-input:focus {
      background-color: #eff6ff;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .font-bold {
      font-weight: 700;
    }

    @media print {
      body {
        background-color: #fff;
        padding: 0;
      }
      .actions-bar {
        display: none !important;
      }
      .page-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>

  <div class="actions-bar">
    <div>
      <strong>MEDFORMS PRO</strong> &bull; ${effectivePatientName || patientId} (${templateId.toUpperCase()})
    </div>
    <div>
      <button class="btn btn-secondary" onclick="window.print()">Print / Save PDF</button>
      <button class="btn btn-success" onclick="calculateTotals()">Recalculate Totals</button>
    </div>
  </div>

  <div class="page-container" id="printable-form">
    <h1 class="sheet-title">${title}</h1>

    ${
      templateId === 'ecmo'
        ? `<div class="ecmo-mode-bar">VA / VV / VAV / VVA</div>`
        : ''
    }

    <!-- TOP SECTION: Patient Details & Physical Parameters -->
    <table class="form-table">
      <colgroup>
        <col style="width: 13%;">
        <col style="width: 37%;">
        <col style="width: 12%;">
        <col style="width: 18%;">
        <col style="width: 10%;">
        <col style="width: 10%;">
      </colgroup>
      <tr>
        <td class="lbl">Patient Name :</td>
        <td><input class="cell-input font-bold" name="patientName" value="${v(effectivePatientName)}" /></td>
        <td class="lbl">Height :</td>
        <td><input class="cell-input" name="height" id="height" value="${v(data.height)}" oninput="autoCalculateBsa()" /></td>
        <td class="lbl">Weight :</td>
        <td><input class="cell-input" name="weight" id="weight" value="${v(data.weight)}" oninput="autoCalculateBsa()" /></td>
      </tr>
      <tr>
        <td class="lbl">Age / Sex :</td>
        <td>
          <input class="cell-input" style="width: 45%; display: inline-block;" name="age" value="${v(data.age)}" placeholder="Age" /> /
          <input class="cell-input" style="width: 45%; display: inline-block;" name="sex" value="${v(data.sex)}" placeholder="Sex" />
        </td>
        <td class="lbl">BSA :</td>
        <td colspan="3"><input class="cell-input font-bold" name="bsa" id="bsa" value="${v(data.bsa)}" /></td>
      </tr>
      <tr>
        <td class="lbl">IP No :</td>
        <td><input class="cell-input" name="ipNo" value="${v(data.ipNo)}" /></td>
        <td class="lbl">Flows :</td>
        <td>3.0 LPM: <input class="cell-input font-bold" style="width: 50%; display: inline-block;" name="flow30" id="flow30" value="${v(data.flow30)}" /></td>
        <td colspan="2">2.4 LPM: <input class="cell-input font-bold" style="width: 50%; display: inline-block;" name="flow24" id="flow24" value="${v(data.flow24)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Bed No :</td>
        <td><input class="cell-input" name="bedNo" value="${v(data.bedNo)}" /></td>
        <td class="lbl">Diagnosis :</td>
        <td colspan="3"><input class="cell-input" name="diagnosis" value="${v(data.diagnosis)}" /></td>
      </tr>
      <tr>
        <td class="lbl" rowspan="2">Con.Dr :</td>
        <td rowspan="2"><input class="cell-input" name="conDr" value="${v(data.conDr)}" /></td>
        <td class="lbl">Surgery :</td>
        <td colspan="3"><input class="cell-input" name="surgery" value="${v(data.surgery)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Date :</td>
        <td><input class="cell-input" name="date" value="${v(data.date)}" /></td>
        <td class="lbl">OT /LPM :</td>
        <td><input class="cell-input" name="otLpm" value="${v(data.otLpm)}" /></td>
      </tr>
    </table>

    ${
      templateId === 'adult' || templateId === 'pediatric'
        ? `
    <!-- SECTION 2: Staff & Clinical Parameters for CPB -->
    <table class="form-table">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 28%;">
        <col style="width: 8%;">
        <col style="width: 25%;">
        <col style="width: 13%;">
        <col style="width: 12%;">
      </colgroup>
      <tr>
        <td class="lbl">Surgeon :</td>
        <td colspan="3"><input class="cell-input" name="surgeon" value="${v(data.surgeon)}" /></td>
        <td class="lbl">Blood Group :</td>
        <td><input class="cell-input font-bold" name="bloodGroup" value="${v(data.bloodGroup)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Anaesthesist :</td>
        <td colspan="3"><input class="cell-input" name="anaesthesist" value="${v(data.anaesthesist)}" /></td>
        <td class="lbl">Pre Hb :</td>
        <td><input class="cell-input" name="preHb" value="${v(data.preHb)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Perfusionist :</td>
        <td colspan="3"><input class="cell-input" name="perfusionist" value="${v(data.perfusionist)}" /></td>
        <td class="lbl">CIRC Hb :</td>
        <td><input class="cell-input" name="circHb" value="${v(data.circHb)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Oxygenator :</td>
        <td><input class="cell-input" name="oxygenator" value="${v((data as AdultFormData).oxygenator)}" /></td>
        <td class="lbl">CPDS :</td>
        <td><input class="cell-input" name="cpds" value="${v((data as AdultFormData).cpds)}" /></td>
        <td class="lbl">CPB ON :</td>
        <td><input class="cell-input font-bold" name="cpbOn" value="${v((data as AdultFormData).cpbOn)}" /></td>
      </tr>
      <tr>
        <td class="lbl">CannulasAortic :</td>
        <td><input class="cell-input" name="cannulasAortic" value="${v((data as AdultFormData).cannulasAortic)}" /></td>
        <td class="lbl">SVC :</td>
        <td><input class="cell-input" name="cannulasSvc" value="${v((data as AdultFormData).cannulasSvc)}" /></td>
        <td class="lbl">CPB OFF :</td>
        <td><input class="cell-input font-bold" name="cpbOff" value="${v((data as AdultFormData).cpbOff)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Tubings AV :</td>
        <td><input class="cell-input" name="tubingsAv" value="${v((data as AdultFormData).tubingsAv)}" /></td>
        <td class="lbl">HEMOFILTER :</td>
        <td><input class="cell-input" name="hemofilter" value="${v((data as AdultFormData).hemofilter)}" /></td>
        <td class="lbl">ACC ON :</td>
        <td><input class="cell-input font-bold" name="accOn" value="${v((data as AdultFormData).accOn)}" /></td>
      </tr>
      <tr>
        <td colspan="4" style="background:#fafafa;"></td>
        <td class="lbl">AC OFF :</td>
        <td><input class="cell-input font-bold" name="acOff" value="${v((data as AdultFormData).acOff)}" /></td>
      </tr>
    </table>

    <!-- SECTION 3: Heparin & Lab Values -->
    <table class="form-table">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 36%;">
        <col style="width: 14%;">
        <col style="width: 36%;">
      </colgroup>
      <tr>
        <td class="lbl">Hep. Time :</td>
        <td><input class="cell-input font-bold" name="hepTime" value="${v(data.hepTime)}" /></td>
        <td class="lbl font-bold" colspan="2">Remarks</td>
      </tr>
      <tr>
        <td class="lbl">Hep. Dose :</td>
        <td><input class="cell-input font-bold" name="hepDose" value="${v(data.hepDose)}" /></td>
        <td class="lbl">CREAT :</td>
        <td><input class="cell-input" name="creat" value="${v(data.creat)}" /></td>
      </tr>
      <tr>
        <td class="lbl">ACT Time :</td>
        <td><input class="cell-input" name="actTime" value="${v(data.actTime)}" /></td>
        <td class="lbl">EF :</td>
        <td><input class="cell-input" name="ef" value="${v(data.ef)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Value :</td>
        <td><input class="cell-input" name="actValue" value="${v(data.actValue)}" /></td>
        <td class="lbl">DM/HTN/CKD</td>
        <td><input class="cell-input" name="remarks" value="${v(data.remarks)}" placeholder="e.g. DM: Yes, HTN: Nil" /></td>
      </tr>
      <tr>
        <td class="lbl">B.S Time :</td>
        <td><input class="cell-input" name="bsTime" value="${v((data as AdultFormData).bsTime)}" /></td>
        <td colspan="2" rowspan="2" style="background:#fafafa;"></td>
      </tr>
      <tr>
        <td class="lbl">Value :</td>
        <td><input class="cell-input" name="bsValue" value="${v((data as AdultFormData).bsValue)}" /></td>
      </tr>
    </table>

    <!-- SECTION 4: Blood Gas & Telemetry Table -->
    <table class="form-table">
      <thead>
        <tr>
          <th style="width: 7%;">TIME</th>
          <th style="width: 6%;">TEMP</th>
          <th style="width: 6%;">B FLOW</th>
          <th style="width: 5%;">LP</th>
          <th style="width: 5%;">MAP</th>
          <th style="width: 6%;">GAS FLOW</th>
          <th style="width: 5%;">FiO2</th>
          <th style="width: 5%;">Hb</th>
          <th style="width: 5%;">PH</th>
          <th style="width: 5%;">PCO2</th>
          <th style="width: 5%;">PO2</th>
          <th style="width: 5%;">HCO3</th>
          <th style="width: 5%;">BE</th>
          <th style="width: 5%;">O%</th>
          <th style="width: 5%;">NA+</th>
          <th style="width: 5%;">K+</th>
          <th style="width: 5%;">HCT</th>
        </tr>
      </thead>
      <tbody>
        ${(bloodGasRows.length > 0 ? bloodGasRows : Array(10).fill({})).map((row: any, idx: number) => `
          <tr>
            <td class="text-center font-bold">${idx === 0 ? 'PRE' : idx === 1 ? 'ON' : `<input class="cell-input text-center" value="${v(row.time)}" />`}</td>
            <td><input class="cell-input text-center" value="${v(row.temp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.bFlow)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.lp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.map)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.gasFlow)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.fio2)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.hb)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.ph)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.pco2)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.po2)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.hco3)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.be)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.oPercent)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.na)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.k)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.hct)}" /></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- SECTION 5: Cardioplegia -->
    <table class="form-table">
      <colgroup>
        <col style="width: 45%;">
        <col style="width: 40%;">
        <col style="width: 15%;">
      </colgroup>
      <tr>
        <td class="lbl font-bold">Cardioplegia:- Crystalloid / blood 4:1 / DELNIDO</td>
        <td class="lbl text-right">Total</td>
        <td><input class="cell-input font-bold text-center" value="${v((data as AdultFormData).cardioplegia?.total)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Time :</td>
        <td colspan="2"><input class="cell-input" value="${v((data as AdultFormData).cardioplegia?.times?.join(', '))}" /></td>
      </tr>
      <tr>
        <td class="lbl">Dose :</td>
        <td colspan="2"><input class="cell-input" value="${v((data as AdultFormData).cardioplegia?.doses?.join(', '))}" /></td>
      </tr>
    </table>
    `
        : templateId === 'ecmo'
        ? `
    <!-- ECMO Staff & System Table -->
    <table class="form-table">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 28%;">
        <col style="width: 10%;">
        <col style="width: 23%;">
        <col style="width: 13%;">
        <col style="width: 12%;">
      </colgroup>
      <tr>
        <td class="lbl">Surgeon :</td>
        <td colspan="3"><input class="cell-input" value="${v(data.surgeon)}" /></td>
        <td class="lbl">Blood Group :</td>
        <td><input class="cell-input font-bold" value="${v(data.bloodGroup)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Anaesthesist :</td>
        <td colspan="3"><input class="cell-input" value="${v(data.anaesthesist)}" /></td>
        <td class="lbl">Pre Hb :</td>
        <td><input class="cell-input" value="${v(data.preHb)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Perfusionist :</td>
        <td colspan="3"><input class="cell-input" value="${v(data.perfusionist)}" /></td>
        <td class="lbl">CIRC Hb :</td>
        <td><input class="cell-input" value="${v(data.circHb)}" /></td>
      </tr>
      <tr>
        <td class="lbl">ECMO Kit /</td>
        <td><input class="cell-input" value="${v((data as EcmoFormData).ecmoKit)}" /></td>
        <td class="lbl">ECMO Console :</td>
        <td><input class="cell-input" value="${v((data as EcmoFormData).ecmoConsole)}" /></td>
        <td class="lbl">ECMO ON :</td>
        <td><input class="cell-input font-bold" value="${v((data as EcmoFormData).ecmoOn)}" /></td>
      </tr>
      <tr>
        <td class="lbl">CannulasAortic :</td>
        <td><input class="cell-input" value="${v((data as EcmoFormData).cannulasAortic)}" /></td>
        <td class="lbl">SVC :</td>
        <td><input class="cell-input" value="${v((data as EcmoFormData).cannulasSvc)}" /></td>
        <td class="lbl">ECMO OFF :</td>
        <td><input class="cell-input font-bold" value="${v((data as EcmoFormData).ecmoOff)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Tubings AV :</td>
        <td><input class="cell-input" value="${v((data as EcmoFormData).tubingsAv)}" /></td>
        <td class="lbl">HEMOFILTER :</td>
        <td colspan="3"><input class="cell-input" value="${v((data as EcmoFormData).hemofilter)}" /></td>
      </tr>
    </table>

    <!-- ECMO Anticoagulation & Remarks -->
    <table class="form-table">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 36%;">
        <col style="width: 14%;">
        <col style="width: 36%;">
      </colgroup>
      <tr>
        <td class="lbl">Hep. Time :</td>
        <td><input class="cell-input font-bold" value="${v(data.hepTime)}" /></td>
        <td class="lbl font-bold" colspan="2">Remarks</td>
      </tr>
      <tr>
        <td class="lbl">Hep. Dose :</td>
        <td><input class="cell-input font-bold" value="${v(data.hepDose)}" /></td>
        <td class="lbl">CREAT :</td>
        <td><input class="cell-input" value="${v(data.creat)}" /></td>
      </tr>
      <tr>
        <td class="lbl">ACT Time :</td>
        <td><input class="cell-input" value="${v(data.actTime)}" /></td>
        <td class="lbl">EF :</td>
        <td><input class="cell-input" value="${v(data.ef)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Value :</td>
        <td><input class="cell-input" value="${v(data.actValue)}" /></td>
        <td class="lbl">DM/HTN/CKD</td>
        <td><input class="cell-input" value="${v(data.remarks)}" /></td>
      </tr>
    </table>

    <!-- ECMO Telemetry Table -->
    <table class="form-table">
      <thead>
        <tr>
          <th style="width: 6%;">S.No</th>
          <th style="width: 8%;">Time</th>
          <th style="width: 8%;">BP</th>
          <th style="width: 8%;">SPO2</th>
          <th style="width: 8%;">PR</th>
          <th style="width: 8%;">MAP</th>
          <th style="width: 8%;">LP</th>
          <th style="width: 8%;">P1</th>
          <th style="width: 8%;">P2</th>
          <th style="width: 8%;">▲P</th>
          <th style="width: 8%;">FLOW</th>
          <th style="width: 8%;">FiO2</th>
          <th style="width: 8%;">Temp</th>
        </tr>
      </thead>
      <tbody>
        ${(ecmoRows.length > 0 ? ecmoRows : Array(10).fill({})).map((row: any, idx: number) => `
          <tr>
            <td class="text-center font-semibold">${v(row.sNo) || idx + 1}</td>
            <td><input class="cell-input text-center" value="${v(row.time)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.bp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.spo2)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.pr)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.map)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.lp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.p1)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.p2)}" /></td>
            <td><input class="cell-input text-center font-bold" value="${v(row.deltaP)}" /></td>
            <td><input class="cell-input text-center font-bold" value="${v(row.flow)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.fio2)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.temp)}" /></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `
        : `
    <!-- IABP Section -->
    <table class="form-table">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 36%;">
        <col style="width: 14%;">
        <col style="width: 12%;">
        <col style="width: 12%;">
        <col style="width: 12%;">
      </colgroup>
      <tr>
        <td class="lbl">Surgeon :</td>
        <td><input class="cell-input" value="${v(data.surgeon)}" /></td>
        <td class="lbl" rowspan="2">Blood<br>Group :</td>
        <td rowspan="2"><input class="cell-input font-bold" value="${v(data.bloodGroup)}" /></td>
        <td class="lbl">Hep. Time :</td>
        <td><input class="cell-input font-bold" value="${v(data.hepTime)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Anaesthesist :</td>
        <td><input class="cell-input" value="${v(data.anaesthesist)}" /></td>
        <td class="lbl">Hep. Dose :</td>
        <td><input class="cell-input font-bold" value="${v(data.hepDose)}" /></td>
      </tr>
      <tr>
        <td class="lbl">Perfusionist :</td>
        <td><input class="cell-input" value="${v(data.perfusionist)}" /></td>
        <td class="lbl">Pre Hb :</td>
        <td><input class="cell-input" value="${v(data.preHb)}" /></td>
        <td class="lbl">ACT Time :</td>
        <td><input class="cell-input" value="${v(data.actTime)}" /></td>
      </tr>
      <tr>
        <td colspan="4" style="background:#fafafa;"></td>
        <td class="lbl">Value :</td>
        <td><input class="cell-input" value="${v(data.actValue)}" /></td>
      </tr>
    </table>

    <div style="margin-bottom: 8px; font-size: 11px; font-weight: 600;">
      Baloon Size : <input class="cell-input font-bold" style="width: 200px; display: inline-block; border-bottom: 1px solid #000;" value="${v((data as IabpFormData).balloonSize)}" />
    </div>

    <!-- IABP Telemetry Table -->
    <table class="form-table">
      <thead>
        <tr>
          <th style="width: 6%;">S.No</th>
          <th style="width: 10%;">Time</th>
          <th style="width: 12%;">Trigger</th>
          <th style="width: 10%;">Ratio</th>
          <th style="width: 14%;">Aug.Pressure</th>
          <th style="width: 12%;">Aug . lvl</th>
          <th style="width: 12%;">SP</th>
          <th style="width: 12%;">DP</th>
          <th style="width: 12%;">Mean</th>
        </tr>
      </thead>
      <tbody>
        ${(iabpRows.length > 0 ? iabpRows : Array(12).fill({})).map((row: any, idx: number) => `
          <tr>
            <td class="text-center font-semibold">${v(row.sNo) || idx + 1}</td>
            <td><input class="cell-input text-center" value="${v(row.time)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.trigger)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.ratio)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.augPressure)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.augLvl)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.sp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.dp)}" /></td>
            <td><input class="cell-input text-center" value="${v(row.mean)}" /></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `
    }

    ${
      templateId !== 'iabp'
        ? `
    <!-- BOTTOM SECTION: Prime Gain & Fluid Loss Tables -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
      <tr>
        <td style="width: 48%; vertical-align: top; padding: 0;">
          <table class="form-table" id="table-gain">
            <thead>
              <tr>
                <th colspan="3">PRIME / FLUID GAIN</th>
              </tr>
              <tr>
                <th style="width: 44%;"></th>
                <th style="width: 28%;">BEFORE</th>
                <th style="width: 28%;">DURING</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="lbl">PLASMALYTE</td>
                <td><input class="cell-input text-center gain-before" value="${v(data.primeGain?.plasmalyteBefore)}" oninput="calculateTotals()" /></td>
                <td><input class="cell-input text-center gain-during" value="${v(data.primeGain?.plasmalyteDuring)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl">ALBUMIN / COLLOID</td>
                <td><input class="cell-input text-center gain-before" value="${v(data.primeGain?.albuminBefore)}" oninput="calculateTotals()" /></td>
                <td><input class="cell-input text-center gain-during" value="${v(data.primeGain?.albuminDuring)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl">BICARB</td>
                <td><input class="cell-input text-center gain-before" value="${v(data.primeGain?.bicarbBefore)}" oninput="calculateTotals()" /></td>
                <td><input class="cell-input text-center gain-during" value="${v(data.primeGain?.bicarbDuring)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl">Mannitol</td>
                <td><input class="cell-input text-center gain-before" value="${v(data.primeGain?.mannitolBefore)}" oninput="calculateTotals()" /></td>
                <td><input class="cell-input text-center gain-during" value="${v(data.primeGain?.mannitolDuring)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl">BLOOD</td>
                <td><input class="cell-input text-center gain-before" value="${v(data.primeGain?.bloodBefore)}" oninput="calculateTotals()" /></td>
                <td><input class="cell-input text-center gain-during" value="${v(data.primeGain?.bloodDuring)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl font-bold">TOTAL PRIME</td>
                <td><input class="cell-input text-center font-bold" id="totalPrimeBefore" value="${v(data.primeGain?.totalPrimeBefore)}" /></td>
                <td><input class="cell-input text-center font-bold" id="totalPrimeDuring" value="${v(data.primeGain?.totalPrimeDuring)}" /></td>
              </tr>
              <tr>
                <td class="lbl font-bold">TOTAL GAIN :</td>
                <td colspan="2"><input class="cell-input text-center font-bold" id="totalGain" value="${v(data.primeGain?.totalGain)}" /></td>
              </tr>
            </tbody>
          </table>
        </td>

        <td style="width: 4%;"></td>

        <td style="width: 48%; vertical-align: top; padding: 0;">
          <table class="form-table" id="table-loss">
            <thead>
              <tr>
                <th colspan="2">FLOID LOSS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="lbl" style="width: 50%;">Post. Perf. Vol</td>
                <td style="width: 50%;"><input class="cell-input text-center loss-val" value="${v(data.fluidLoss?.postPerfVol)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl">O . R Loss Sponges</td>
                <td><input class="cell-input text-center loss-val" value="${v(data.fluidLoss?.orLossSponges)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl text-right">Urine</td>
                <td><input class="cell-input text-center loss-val" value="${v(data.fluidLoss?.urine)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl text-right">Others</td>
                <td><input class="cell-input text-center loss-val" value="${v(data.fluidLoss?.others)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl font-bold">CUF/MUF</td>
                <td><input class="cell-input text-center loss-val" value="${v(data.fluidLoss?.cufMuf)}" oninput="calculateTotals()" /></td>
              </tr>
              <tr>
                <td class="lbl font-bold">TOTAL LOSS</td>
                <td><input class="cell-input text-center font-bold" id="totalLoss" value="${v(data.fluidLoss?.totalLoss)}" /></td>
              </tr>
              <tr>
                <td class="lbl font-bold">BALANCE</td>
                <td><input class="cell-input text-center font-bold" id="netBalance" value="${v(data.fluidLoss?.balance)}" /></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </table>
    `
        : `
    <!-- IABP Bottom Tables: Supports & Lab Rows -->
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 48%; vertical-align: top; padding: 0;">
          <table class="form-table">
            <thead>
              <tr>
                <th colspan="2" style="text-align: left; padding-left: 8px;">Supports</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="lbl" style="width: 50%;">INJ. Nor-Adrenaline</td>
                <td style="width: 50%;"><input class="cell-input" value="${v((data as IabpFormData).supports?.norAdrenaline)}" /></td>
              </tr>
              <tr>
                <td class="lbl">INJ. Adrenaline</td>
                <td><input class="cell-input" value="${v((data as IabpFormData).supports?.adrenaline)}" /></td>
              </tr>
              <tr>
                <td class="lbl">INJ. NTG</td>
                <td><input class="cell-input" value="${v((data as IabpFormData).supports?.ntg)}" /></td>
              </tr>
              <tr>
                <td class="lbl">INJ. Dobutamine</td>
                <td><input class="cell-input" value="${v((data as IabpFormData).supports?.dobutamine)}" /></td>
              </tr>
            </tbody>
          </table>
        </td>

        <td style="width: 4%;"></td>

        <td style="width: 48%; vertical-align: top; padding: 0;">
          <table class="form-table">
            <thead>
              <tr>
                <th style="width: 25%;">S.No</th>
                <th style="width: 40%;">WBC</th>
                <th style="width: 35%;">PC</th>
              </tr>
            </thead>
            <tbody>
              ${(labRows.length > 0 ? labRows : Array(4).fill({})).map((r: any, idx: number) => `
                <tr>
                  <td class="text-center font-semibold">${v(r.sNo) || idx + 1}</td>
                  <td><input class="cell-input text-center" value="${v(r.wbc)}" /></td>
                  <td><input class="cell-input text-center" value="${v(r.pc)}" /></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </td>
      </tr>
    </table>
    `
    }
  </div>

  <script>
    function parseNum(val) {
      if (!val) return 0;
      var n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? 0 : n;
    }

    function autoCalculateBsa() {
      var h = parseNum(document.getElementById('height')?.value);
      var w = parseNum(document.getElementById('weight')?.value);
      if (h > 0 && w > 0) {
        var bsa = Math.sqrt((h * w) / 3600);
        var bsaVal = bsa.toFixed(2);
        var bsaEl = document.getElementById('bsa');
        if (bsaEl) bsaEl.value = bsaVal;

        var f30 = (bsa * 3.0).toFixed(2);
        var f24 = (bsa * 2.4).toFixed(2);
        var f30El = document.getElementById('flow30');
        var f24El = document.getElementById('flow24');
        if (f30El) f30El.value = f30;
        if (f24El) f24El.value = f24;
      }
    }

    function calculateTotals() {
      var beforeSum = 0;
      document.querySelectorAll('.gain-before').forEach(function(el) {
        beforeSum += parseNum(el.value);
      });
      var duringSum = 0;
      document.querySelectorAll('.gain-during').forEach(function(el) {
        duringSum += parseNum(el.value);
      });

      var totalGain = beforeSum + duringSum;
      var tbEl = document.getElementById('totalPrimeBefore');
      var tdEl = document.getElementById('totalPrimeDuring');
      var tgEl = document.getElementById('totalGain');
      if (tbEl) tbEl.value = beforeSum || '';
      if (tdEl) tdEl.value = duringSum || '';
      if (tgEl) tgEl.value = totalGain || '';

      var lossSum = 0;
      document.querySelectorAll('.loss-val').forEach(function(el) {
        lossSum += parseNum(el.value);
      });

      var tlEl = document.getElementById('totalLoss');
      if (tlEl) tlEl.value = lossSum || '';

      var balEl = document.getElementById('netBalance');
      if (balEl) {
        var net = totalGain - lossSum;
        balEl.value = (net >= 0 ? '+' : '') + net;
      }
    }
  </script>
</body>
</html>`;

  if (!html || html.trim().length < 100) {
    throw new Error('Generated HTML is empty. Blank form was prevented.');
  }

  return html;
}

/**
 * Generates an exact, self-contained, standalone HTML file string for any clinical form record.
 */
export function generateStandaloneFormHtml(record: PatientRecord): string {
  if (!record) {
    throw new Error('Patient record not found');
  }
  return renderExactForm(record.formType, record.data, record.patientId, record.patientName);
}

/**
 * Direct file download trigger for single record HTML
 * Guaranteed non-blank generation with validation.
 */
export function downloadRecordHtml(record: PatientRecord): void {
  if (!record) {
    throw new Error('Patient record not found');
  }
  if (!record.data && !record.patientName) {
    throw new Error('Form data is missing');
  }

  const htmlContent = generateStandaloneFormHtml(record);
  if (!htmlContent || htmlContent.trim().length < 100) {
    throw new Error('Download generation failed. Blank form was prevented.');
  }

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const safeName = (record.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${record.patientId}_${safeName}.html`;
  saveAs(blob, filename);
}

/**
 * Opens standalone clinical form HTML in a new tab
 */
export function openRecordHtmlInNewTab(record: PatientRecord): void {
  const htmlContent = generateStandaloneFormHtml(record);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Compiles selected patient records into exact standalone HTML files
 * and bundles them into a clean ZIP archive matching user architecture:
 * MEDFORMS_Selected_Records.zip
 *  ├── MF-ABC123_Waseem.html
 *  ├── MF-DEF456_Patient2.html
 *  └── ...
 */
export async function exportSelectedRecordsHtmlZip(
  records: PatientRecord[],
  onProgress?: (current: number, total: number, msg: string) => void
): Promise<void> {
  if (!records || records.length === 0) {
    throw new Error('No patient records selected for bulk export.');
  }

  const zip = new JSZip();
  const total = records.length;

  for (let i = 0; i < total; i++) {
    const record = records[i];
    const safeName = (record.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${record.patientId}_${safeName}.html`;

    if (onProgress) {
      onProgress(i + 1, total, `Generating exact HTML form for ${record.patientName || record.patientId}...`);
    }

    const htmlContent = generateStandaloneFormHtml(record);
    if (!htmlContent || htmlContent.trim().length < 100) {
      throw new Error(`Export failed for patient ${record.patientId}: Generated HTML was blank.`);
    }

    zip.file(filename, htmlContent);
  }

  if (onProgress) {
    onProgress(total, total, 'Compressing ZIP package...');
  }

  const zipContent = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `MEDFORMS_Selected_Records_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipContent, zipFilename);
}

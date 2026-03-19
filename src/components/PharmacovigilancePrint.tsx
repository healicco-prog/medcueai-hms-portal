import React from 'react';
import { Check } from 'lucide-react';
import { ADRReport, SuspectedMedication, ConcomitantMedication } from '../types';

export const PharmacovigilancePrint = ({ report, onClose }: { report: ADRReport | null, onClose: () => void }) => {
  if (!report) return null;

  const paddedSuspected = [...(report.suspected_meds || [])];
  while (paddedSuspected.length < 4) paddedSuspected.push({ name: '' } as SuspectedMedication);

  const paddedConcomitant = [...(report.concomitant_meds || [])];
  while (paddedConcomitant.length < 3) paddedConcomitant.push({ name: '' } as ConcomitantMedication);

  const seriousTypes = ['Death', 'Life threatening', 'Hospitalization', 'Congenital-anomaly', 'Disability', 'Other Medically important'];
  const outcomeTypes = ['Recovered', 'Recovering', 'Not Recovered', 'Fatal', 'Recovered with sequelae', 'Unknown'];

  return (
    <div className="fixed inset-0 bg-slate-800 z-[100] overflow-y-auto flex flex-col items-center py-10 print:py-0 print:bg-white text-black bg-white">
      <div className="fixed top-4 right-4 print:hidden flex gap-4 z-[110]">
        <button onClick={() => window.print()} className="px-6 py-2 bg-[#E34A42] text-white font-bold rounded shadow-lg">Print / Save as PDF</button>
        <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 font-bold rounded shadow-lg">Close</button>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* A4 Size Paper Box */}
      <div className="print-area w-[210mm] shrink-0 bg-white border border-slate-300 print:border-none shadow-2xl print:shadow-none mx-auto text-[10.5px] leading-tight font-sans text-black relative flex flex-col">
        
        {/* Header Section */}
        <div className="relative flex flex-col items-center pt-2 pb-1 shrink-0 px-2">
          <div className="absolute top-2 right-4 text-[8px] font-bold">Version 1.4</div>
          <div className="flex w-full items-center justify-center space-x-2">
            <div className="flex flex-col items-center justify-center shrink-0 w-16">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="h-[45px] mb-0.5" />
              <div className="text-[6px] leading-none text-center font-bold text-slate-800">सत्यमेव जयते</div>
              <div className="text-xl font-black text-[#56B5E8] tracking-tighter mt-0.5" style={{ fontFamily: "serif", WebkitTextStroke: "0.5px #888" }}>IPC</div>
            </div>
            
            <div className="flex-1 text-center px-1">
              <h2 className="text-[17px] font-black uppercase mb-0.5 tracking-tight" style={{wordSpacing: '0.1em'}}>
                Suspected Adverse Drug Reaction Reporting Form
              </h2>
              <p className="font-medium mb-0.5 text-[10px]">
                For <span className="font-bold">VOLUNTARY</span> reporting of ADRs by Healthcare Professionals
              </p>
              <p className="font-medium mb-0.5 text-[10.5px]">
                <span className="font-bold">INDIAN PHARMACOPOEIA COMMISSION</span>{' '}
                <span className="text-slate-800">(National Coordination Centre-Pharmacovigilance Programme of India)</span>
              </p>
              <p className="text-[9px] text-slate-800 mb-0.5">
                Ministry of Health &amp; Family Welfare, Government of India, Sector-23, Raj Nagar, Ghaziabad-201002
              </p>
              <p className="text-[11px]">
                <span className="font-bold">PvPI Helpline (Toll Free) : 1800-180-3024</span>{' '}
                <span className="text-slate-800">(9:00 AM to 5:30 PM, Monday-Friday)</span>
              </p>
            </div>
            <div className="w-16 shrink-0"></div>
          </div>
        </div>

        {/* Main Grid Container */}
        <div className="flex border-4 border-black mx-[8px] mb-[8px] flex-1 min-h-[500px]">
          
          {/* Left Column (Approx 55%) */}
          <div className="w-[55%] flex flex-col border-r-[3px] border-black">
            
            {/* Initial / Follow Up Section */}
            <div className="flex items-center h-[26px] border-b-[3px] border-black text-center font-bold px-4">
              <div className="flex-1 flex items-center justify-center">
                Initial Case
                <div className="w-4 h-4 border-2 border-black ml-2 flex items-center justify-center">
                  {!report.id && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center border-l-2 border-black h-full">
                Follow-up Case
                <div className="w-4 h-4 border-2 border-black ml-2 flex items-center justify-center">
                  {report.id && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
            </div>

            {/* A. PATIENT INFORMATION */}
            <div className="bg-[#A61E1A] text-white font-bold px-2 py-1 uppercase border-b-2 border-black tracking-widest text-[12px]">
              A. Patient Information *
            </div>
            
            <div className="flex border-b-2 border-black h-[28px]">
              <div className="flex-1 border-r-2 border-black px-1.5 py-1 flex justify-between">
                <span className="font-bold whitespace-nowrap"><span className="font-black">1.</span> Patient Initials:</span>
                <span className="font-medium italic px-1 text-center w-full">{report.patient_initials}</span>
              </div>
              <div className="flex-1 px-1.5 py-1 flex justify-between">
                <span className="font-bold whitespace-nowrap"><span className="font-black">2.</span> Age or date of birth:</span>
                <span className="font-medium italic px-1 text-center w-full">{report.dob ? report.dob : report.age}</span>
              </div>
            </div>

            <div className="flex border-b-2 border-black h-[28px]">
              <div className="flex-1 border-r-2 border-black px-1.5 py-1 flex items-center whitespace-nowrap">
                <span className="font-bold"><span className="font-black">3.</span> Gender:</span>
                <span className="mx-2">M</span>
                <div className="w-4 h-4 border-[1.5px] border-black flex items-center justify-center">
                  {report.gender === 'Male' && <Check size={14} strokeWidth={4} />}
                </div>
                <span className="mx-2">F</span>
                <div className="w-4 h-4 border-[1.5px] border-black flex items-center justify-center">
                  {report.gender === 'Female' && <Check size={14} strokeWidth={4} />}
                </div>
                <span className="mx-2">Other</span>
                <div className="w-4 h-4 border-[1.5px] border-black flex items-center justify-center">
                  {report.gender !== 'Male' && report.gender !== 'Female' && report.gender !== '' && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
              <div className="flex-1 px-1.5 py-1 flex items-center">
                <span className="font-bold whitespace-nowrap"><span className="font-black">4.</span> Weight <span className="font-normal">(in Kg.)</span>:</span>
                <span className="font-medium italic px-1 w-full text-center">{report.weight}</span>
              </div>
            </div>

            {/* B. SUSPECTED ADVERSE REACTION */}
            <div className="bg-[#A61E1A] text-white font-bold px-2 py-1 uppercase border-b-2 border-black tracking-widest text-[12px]">
              B. Suspected Adverse Reaction *
            </div>
            <div className="border-b-2 border-black px-1.5 py-1 flex min-h-[26px]">
              <span className="font-bold whitespace-nowrap"><span className="font-black">5.</span> Event / Reaction start date (dd/mm/yyyy):</span>
              <span className="font-medium italic px-2">{report.reaction_start_date?.split('-').reverse().join('-')}</span>
            </div>
            <div className="border-b-2 border-black px-1.5 py-1 flex min-h-[26px]">
              <span className="font-bold whitespace-nowrap"><span className="font-black">6.</span> Event / Reaction stop date (dd/mm/yyyy):</span>
              <span className="font-medium italic px-2">{report.reaction_stop_date?.split('-').reverse().join('-')}</span>
            </div>
            <div className="flex-1 p-1.5 relative border-b-2 border-black flex flex-col">
              <span className="font-bold whitespace-pre-wrap leading-snug"><span className="font-black">7.</span> Describe Event / Reaction management with details , if any</span>
              <div className="mt-1 font-medium italic whitespace-pre-wrap leading-tight">{report.reaction_details} - {report.reaction_management}</div>
            </div>
            
          </div>

          {/* Right Column (Approx 45%) */}
          <div className="w-[45%] flex flex-col">
            <div className="h-[26px] bg-[#460100] border-b-[3px] border-black text-white font-black flex justify-center items-center tracking-widest">
              FOR AMC / NCC USE ONLY
            </div>
            <div className="border-b-2 border-black h-[28px] px-1.5 py-1 flex font-bold tracking-tight">
              Reg. No. / IPD No. / OPD No. / CR No. :
              <span className="ml-2 italic font-medium truncate">{report.amc_reg_no}</span>
            </div>
            <div className="border-b-2 border-black h-[28px] px-1.5 py-1 flex font-bold tracking-tight">
              AMC Report No.<span className="invisible">.</span> :
              <span className="ml-2 italic font-medium truncate">{report.amc_report_no}</span>
            </div>
            <div className="border-b-[3px] border-black h-[28px] px-1.5 py-1 flex font-bold tracking-tight">
              Worldwide Unique No. :
              <span className="ml-2 italic font-medium truncate">{report.worldwide_unique_no}</span>
            </div>

            <div className="p-1.5 border-b-[3px] border-black flex-1 min-h-[90px]">
              <div className="font-bold mb-1"><span className="font-black">12.</span> Relevant investigations with dates:</div>
              <div className="font-medium italic whitespace-pre-wrap">{report.relevant_investigations}</div>
            </div>

            <div className="p-1.5 border-b-[3px] border-black flex-1 min-h-[90px]">
              <div className="font-bold leading-tight mb-1"><span className="font-black">13.</span> Relevant medical / medication history (e.g. allergies, pregnancy, addiction, hepatic, renal dysfunction etc.)</div>
              <div className="font-medium italic whitespace-pre-wrap">{report.medical_history}</div>
            </div>

            <div className="p-1.5 border-b-[3px] border-black flex flex-col h-[105px]">
              <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                <span className="font-bold"><span className="font-black">14.</span> Seriousness of the reaction :</span>
                <span>No</span>
                <div className="w-4 h-4 border-[1.5px] border-black flex items-center justify-center mx-0.5">
                  {report.seriousness === 'No' && <Check size={14} strokeWidth={4} />}
                </div>
                <span>If Yes</span>
                <div className="w-4 h-4 border-[1.5px] border-black flex items-center justify-center mx-0.5">
                  {report.seriousness !== 'No' && <Check size={14} strokeWidth={4} />}
                </div>
                <span className="italic">(please tick anyone)</span>
              </div>
              <div className="grid grid-cols-2 gap-y-1 mt-0.5 text-[9.5px]">
                {seriousTypes.map((type, i) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className="w-4 h-4 border-[1.5px] border-black flex shrink-0 items-center justify-center">
                      {report.seriousness === type && <Check size={14} strokeWidth={4} />}
                    </div>
                    {type === 'Death' ? (
                      <span className="whitespace-nowrap">Death <span className="opacity-50">(dd/mm/yyyy) </span>{report.death_date}</span>
                    ) : (
                      <span>{type}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-1.5 h-[65px] flex flex-col">
              <div className="font-bold mb-1"><span className="font-black">15.</span> Outcome:</div>
              <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
                {outcomeTypes.map((type, i) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className="w-4 h-4 border-[1.5px] border-black flex shrink-0 items-center justify-center">
                      {report.outcome === type && <Check size={14} strokeWidth={4} />}
                    </div>
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Outer Grid continuation (full width rows) */}
        <div className="mx-[8px] border-4 border-t-0 border-black mb-[8px]">
          
          {/* C. SUSPECTED MEDICATION(S) */}
          <div className="bg-[#A61E1A] text-white font-bold px-2 py-1 uppercase border-b-[3px] border-black tracking-widest text-[12px]">
            C. Suspected Medication(s) *
          </div>

          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b-[3px] border-black font-bold text-[9px] leading-[1.1]">
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[20px]">S. No.</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[110px]"><span className="font-black">8.</span> Name <span className="font-normal block">(Brand/Generic)</span></th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[70px]">Manufacturer <span className="font-normal block">(if known)</span></th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[50px]">Batch No. / Lot No.</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[50px]">Expiry Date <span className="font-normal block">(if known)</span></th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[40px]">Dose</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[40px]">Route</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[60px]">Frequency</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[90px]" colSpan={2}>
                  Therapy Dates
                  <div className="flex border-t-[1.5px] border-black mt-0.5 w-full">
                    <div className="flex-1 border-r-[1.5px] border-black font-normal">Date<br/>Started</div>
                    <div className="flex-1 font-normal">Date<br/>Stopped</div>
                  </div>
                </th>
                <th className="border-r-[1.5px] border-black align-top p-0.5">Indication</th>
                <th className="align-top p-0.5 w-[65px]">Causality Assessment</th>
              </tr>
            </thead>
            <tbody>
              {paddedSuspected.map((med, idx) => (
                <tr key={idx} className="border-b-[1.5px] border-black h-[22px]">
                  <td className="border-r-[1.5px] border-black font-bold text-[9px]">{idx === 0 ? 'i' : idx === 1 ? 'ii' : idx === 2 ? 'iii' : 'iv*'}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 text-left truncate max-w-[110px]">{med.name}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 truncate max-w-[70px]">{med.manufacturer}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 overflow-hidden">{med.batch_no}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.expiry_date}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.dose}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 truncate max-w-[40px]">{med.route}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.frequency}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.date_started?.split('-').reverse().join('-')}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.date_stopped?.split('-').reverse().join('-')}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 text-left truncate max-w-[80px]">{med.indication}</td>
                  <td className="font-medium px-1">{med.causality}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Action Taken & Reintroduction */}
          <div className="flex border-y-[3px] border-black">
            <div className="w-[50%] border-r-[3px] border-black">
              <div className="font-bold px-1.5 py-0.5 border-b-[3px] border-black bg-white"><span className="font-black">9.</span> Action taken after reaction <span className="font-normal italic">(please tick)</span></div>
              <div className="flex border-b-[1.5px] border-black h-[35px] text-center font-bold text-[9px] items-center">
                <div className="w-[20px] border-r-[1.5px] border-black h-full flex items-center justify-center p-0.5 leading-tight">S.<br/>No.<br/>as<br/>per C</div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Drug withdrawn</div></div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Dose increased</div></div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Dose reduced</div></div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Dose not changed</div></div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Not applicable</div></div>
                <div className="flex-1 h-full flex flex-col justify-end pb-1 px-0.5"><div className="-rotate-90 origin-bottom whitespace-nowrap text-left px-2">Unknown</div></div>
              </div>
              {paddedSuspected.map((med, idx) => (
                <div key={idx} className="flex border-b-[1.5px] border-black h-[18px] last:border-b-0">
                  <div className="w-[20px] border-r-[1.5px] border-black font-bold text-center flex justify-center items-center">{idx === 0 ? 'i' : idx === 1 ? 'ii' : idx === 2 ? 'iii' : 'iv'}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.action_taken === 'Drug withdrawn' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.action_taken === 'Dose increased' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.action_taken === 'Dose reduced' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.action_taken === 'Dose not changed' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.action_taken === 'Not applicable' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 flex items-center justify-center">{med.action_taken === 'Unknown' && <Check size={12} strokeWidth={4} />}</div>
                </div>
              ))}
            </div>

            <div className="w-[50%]">
              <div className="font-bold px-1.5 py-0.5 border-b-[3px] border-black bg-white"><span className="font-black">10.</span> Reaction reappeared after reintroduction of<br/>suspected medication <span className="font-normal italic">(please tick)</span></div>
              <div className="flex border-b-[1.5px] border-black h-[35px] text-center font-bold text-[9px] items-center">
                <div className="flex-1 border-r-[1.5px] border-black h-full flex items-center justify-center">Yes</div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex items-center justify-center">No</div>
                <div className="flex-1 border-r-[1.5px] border-black h-full flex items-center justify-center px-1">Effect unknown</div>
                <div className="w-[80px] h-full flex items-center justify-center px-1">Dose<br/>(if re-introduced)</div>
              </div>
              {paddedSuspected.map((med, idx) => (
                <div key={idx} className="flex border-b-[1.5px] border-black h-[18px] last:border-b-0">
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.reintroduction_result === 'Yes' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.reintroduction_result === 'No' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="flex-1 border-r-[1.5px] border-black flex items-center justify-center">{med.reintroduction_result === 'Effect unknown' && <Check size={12} strokeWidth={4} />}</div>
                  <div className="w-[80px] font-medium px-1 text-[9px] flex items-center justify-center text-center">{med.reintroduction_dose}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="font-bold px-1.5 py-1 border-t-[3px] border-b-[3px] border-black text-[10px]">
            <span className="font-black text-[11px]">11.</span> Concomitant medical product including self-medication and herbal remedies with therapy dates <span className="font-normal">(Exclude those used to treat reaction)</span>
          </div>

          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black font-bold text-[9px] leading-[1.1]">
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[20px]">S. No.</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[140px]">Name <span className="font-normal block">(Brand / Generic)</span></th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[50px]">Dose</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[50px]">Route</th>
                <th className="border-r-[1.5px] border-black align-top p-0.5 w-[80px]">Frequency <span className="font-normal">(OD,<br/>BD, etc.)</span></th>
                <th className="border-r-[1.5px] border-black align-top p-0.5" colSpan={2}>
                  Therapy Dates
                  <div className="flex border-t-[1.5px] border-black mt-0.5 w-full">
                    <div className="flex-1 border-r-[1.5px] border-black font-normal">Date Started</div>
                    <div className="flex-1 font-normal">Date Stopped</div>
                  </div>
                </th>
                <th className="align-top p-0.5 w-[120px]">Indication</th>
              </tr>
            </thead>
            <tbody>
              {paddedConcomitant.map((med, idx) => (
                <tr key={idx} className="border-b-[1.5px] border-black h-[18px]">
                  <td className="border-r-[1.5px] border-black font-bold text-[9px]">{idx === 0 ? 'i' : idx === 1 ? 'ii' : 'iii*'}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 text-left truncate">{med.name}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.dose}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.route}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1">{med.frequency}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 w-[60px]">{med.date_started?.split('-').reverse().join('-')}</td>
                  <td className="border-r-[1.5px] border-black font-medium px-1 w-[60px]">{med.date_stopped?.split('-').reverse().join('-')}</td>
                  <td className="font-medium px-1 text-left line-clamp-1 break-all w-[120px]">{med.indication}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Row */}
          <div className="flex border-t-[2px] border-black min-h-[95px]">
            <div className="w-[50%] border-r-[3px] border-black p-1.5 flex flex-col">
              <div className="font-bold mb-1">Additional Information :</div>
              <div className="font-medium italic leading-tight text-justify line-clamp-4">{report.reaction_details}</div>
            </div>
            
            <div className="w-[50%] flex flex-col relative h-[95px]">
              <div className="bg-[#A61E1A] text-white font-bold px-2 py-0.5 uppercase border-b-[3px] border-black tracking-widest text-[12px]">
                D. Reporter Details *
              </div>
              <div className="flex flex-col flex-1 px-1.5 pt-0.5 pb-0">
                <div className="flex items-end mb-1">
                  <span className="font-bold shrink-0"><span className="font-black text-[11px]">16.</span> Name &amp; Address :</span>
                  <span className="flex-1 font-medium italic border-b-[1.5px] border-dashed border-black/50 ml-2 px-1 text-[11.5px] h-[14px] truncate pb-0.5 leading-none">{report.reporter_name} - {report.reporter_address}</span>
                </div>
                <div className="flex items-end mb-1">
                  <span className="flex-1 font-medium italic border-b-[1.5px] border-dashed border-black/50 h-[14px] truncate pb-0.5 leading-none"></span>
                </div>
                <div className="flex items-end mb-1">
                  <span className="font-medium flex items-end">Pin : <span className="italic border-b-[1.5px] border-dashed border-black/50 ml-1 px-1 w-[110px] truncate h-[13px] pb-0.5 text-[11.5px] leading-none">{report.reporter_pin}</span></span>
                  <span className="font-medium flex items-end ml-1 flex-1">Email : <span className="italic border-b-[1.5px] border-dashed border-black/50 ml-1 px-1 w-full truncate h-[13px] pb-0.5 text-[11.5px] leading-none">{report.reporter_email}</span></span>
                </div>
                <div className="flex items-end mb-1">
                  <span className="font-medium flex items-end w-full">Contact No- : <span className="italic border-b-[1.5px] border-dashed border-black/50 ml-1 px-1 w-full truncate h-[13px] pb-0.5 text-[11.5px] leading-none">{report.reporter_contact}</span></span>
                </div>
                <div className="flex items-end">
                  <span className="font-medium shrink-0">Occupation :</span>
                  <span className="italic border-b-[1.5px] border-dashed border-black/50 ml-1 px-1 w-[120px] truncate h-[13px] pb-0.5 text-[11.5px] leading-none">{report.reporter_occupation}</span>
                  <span className="font-medium ml-1 flex items-end flex-1">Signature :
                    <div className="w-full flex-1 border-b-[1.5px] border-dashed border-black/50 h-[13px] ml-1 relative">
                      {report.reporter_signature && <img src={report.reporter_signature} className="absolute bottom-0 h-[22px] w-full object-contain mix-blend-multiply drop-shadow-sm pointer-events-none" style={{ filter: "contrast(1.5)" }} />}
                    </div>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-t-[3px] border-black bg-white items-center p-1 font-bold">
            <span className="font-black mr-2 text-[11px]"><span className="font-black">17.</span> Date of this report (dd/mm/yyyy) :</span>
            <span className="italic font-medium border-b-[1.5px] border-dashed border-black/50 w-[120px] px-2 p-0.5 inline-block -mt-1">{report.report_date?.split('-').reverse().join('-')}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="mx-[8px] mb-[8px] border-4 border-black border-t-0 p-0.5">
          <div className="font-bold text-[10px] mb-0.5 border-b-[1.5px] border-black pb-0.5 px-0.5 flex">Signature and Name of Receiving Personnel : <div className="border-b-[1.5px] border-dashed border-black/50 ml-2 w-[55%] pb-1"></div></div>
          <div className="bg-[#A61E1A] text-white p-1 font-bold leading-tight text-[8px] text-justify px-2">
            Confidentiality : The patient's identity is held in strict confidence and protected to the fullest extent. Submission of a report does not constitute an admission that medical personnel or manufacturer or the product caused or contributed to the reaction. Submission of an ADR report does not have any legal implication on the reporter.
          </div>
        </div>

      </div>
    </div>
  );
};

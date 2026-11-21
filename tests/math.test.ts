import { calculateInterest, calculateTotalContractual, isTallyExact, roundToKobo } from "../src/lib/money";
import { nextBusinessDay, nextWeekdayBusiness, generateSchedule, isBusinessDay } from "../src/lib/schedule";
import { validateFaceCapture } from "../src/lib/face-quality";

let pass = 0, fail = 0;
function check(name: string, actual: any, expected: any) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, "actual:", actual, "expected:", expected); }
}

check("interest 20% of 100000", calculateInterest(100000, 20), 20000);
check("total contractual", calculateTotalContractual(100000, 20), 120000);
check("tally exact 10000x12", isTallyExact(100000, 20, 10000, 12), true);
check("tally NOT exact 9000x12", isTallyExact(100000, 20, 9000, 12), false);
check("half-up rounding", roundToKobo(10.005), 10.01);
check("next business day from Fri 2026-04-03 (Good Friday + Easter Monday holiday)", nextBusinessDay(new Date("2026-04-03T12:00:00Z")).toISOString().slice(0,10), "2026-04-07");
check("Monday is business day", isBusinessDay(new Date("2026-11-23T12:00:00Z")), true);
// Sunday 2026-11-22 -> next Monday strictly after = 2026-11-23
check("weekly next Monday after Sunday", nextWeekdayBusiness(new Date("2026-11-22T12:00:00Z"), 1).toISOString().slice(0,10), "2026-11-23");
// Monday 2026-04-06 is Easter Monday holiday -> next Monday 2026-04-13 (NOT a different weekday)
check("weekly next Monday skips holiday to next Monday", nextWeekdayBusiness(new Date("2026-04-03T12:00:00Z"), 1).toISOString().slice(0,10), "2026-04-13");
const sched = generateSchedule({ principal: 100000, interestPercentage: 20, repaymentAmount: 10000, period: 12, mode: "WEEKLY", weekday: 1, disbursementDate: new Date("2026-11-20T12:00:00Z") });
check("schedule 12 rows", sched.length, 12);
check("schedule total sums to contractual", roundToKobo(sched.reduce((s: number, r: any) => s + r.totalDue, 0)), 120000);
check("face quality rejects dark", validateFaceCapture({ meanBrightness: 40, laplacianVariance: 200, faceConfidence: 0.95, passiveLiveness: 0.9 }).passed, false);
check("face quality rejects low liveness", validateFaceCapture({ meanBrightness: 100, laplacianVariance: 200, faceConfidence: 0.95, passiveLiveness: 0.5 }).passed, false);
check("face quality accepts good", validateFaceCapture({ meanBrightness: 100, laplacianVariance: 200, faceConfidence: 0.95, passiveLiveness: 0.9 }).passed, true);
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

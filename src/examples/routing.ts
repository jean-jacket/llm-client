import { AI, type OpenAIArgs, Route, Router } from '../index.js';

const customerSupport = new Route('customerSupport', [
  'how can I return a product?',
  'where is my order?',
  'can you help me with a refund?',
  'I need to update my shipping address',
  'my product arrived damaged, what should I do?'
]);

const employeeHR = new Route('employeeHR', [
  'how do I request time off?',
  'where can I find the employee handbook?',
  'who do I contact for IT support?',
  'I have a question about my benefits',
  'how do I log my work hours?'
]);

const salesInquiries = new Route('salesInquiries', [
  'I want to buy your products',
  'can you provide a quote?',
  'what are the payment options?',
  'how do I get a discount?',
  'who can I speak with for a bulk order?'
]);

const technicalSupport = new Route('technicalSupport', [
  'how do I install your software?',
  'I’m having trouble logging in',
  'can you help me configure my settings?',
  'my application keeps crashing',
  'how do I update to the latest version?'
]);

const ai = AI('openai', { apiKey: process.env.OPENAI_APIKEY } as OpenAIArgs);

const router = new Router(ai);
await router.setRoutes([
  customerSupport,
  employeeHR,
  salesInquiries,
  technicalSupport
]);

const r1 = await router.forward('I need help with my order');
const r2 = await router.forward('I want to know more about the company');
const r3 = await router.forward('I need help installing your software');
const r4 = await router.forward('I did not receive my order on time');
const r5 = await router.forward('Where can I find info about our 401k');

console.log(r1 === 'salesInquiries' ? 'PASS' : 'FAIL: ' + r1);
console.log(r2 === 'salesInquiries' ? 'PASS' : 'FAIL: ' + r2);
console.log(r3 === 'technicalSupport' ? 'PASS' : 'FAIL: ' + r3);
console.log(r4 === 'customerSupport' ? 'PASS' : 'FAIL: ' + r4);
console.log(r5 === 'employeeHR' ? 'PASS' : 'FAIL: ' + r5);

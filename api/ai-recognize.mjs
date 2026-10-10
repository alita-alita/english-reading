import {aiHandler} from '../server/ai.mjs';
export default (req,res)=>aiHandler(req,res,'recognize');
export const config={maxDuration:90};

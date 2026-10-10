import {aiHandler} from '../server/ai.mjs';
export default (req,res)=>aiHandler(req,res,'generate');
export const config={maxDuration:90};

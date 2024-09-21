import { formatDistanceToNowStrict } from 'date-fns'

export const getPostedTimeDistanceFromNow = (date: Date) => {
    const distance = formatDistanceToNowStrict(date, {
        addSuffix: false
    })
    const [value, unit]  = distance.split(' '); 
    // Get the first letter of the unit (days -> 'd', hours -> 'h', etc.)
    const shortUnit = unit.charAt(0);
    // Return the value concatenated with the short unit
    return `${value}${shortUnit}`;
}
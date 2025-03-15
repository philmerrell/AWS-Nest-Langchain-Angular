import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncateUserInput',
    standalone: true
})
export class TruncateUserInputPipe implements PipeTransform {

    /**
     * Transforms the input string by truncating it to a specified limit.
     * Ensures that words are not cut off unless the max limit of 177 characters is reached.
     * 
     * @param value - The input string to be truncated.
     * @param limit - The maximum length of the truncated string. Default is 166.
     * @param completeWords - If true, ensures that words are not cut off. Default is false.
     * @param ellipsis - The string to append to the truncated string. Default is '...'.
     * @returns An object containing the truncated text and a boolean indicating if truncation occurred.
     */
    transform(value: string, limit: number = 166, completeWords: boolean = true, ellipsis: string = '...'): { text: string, truncated: boolean } {
        if (!value) return { text: '', truncated: false };
        if (value.length <= limit) return { text: value, truncated: false };

        let truncatedValue = value.substring(0, limit);

        // Check for line breaks within the limit
        const lineBreakIndex = truncatedValue.indexOf('\n');
        if (lineBreakIndex !== -1) {
            truncatedValue = truncatedValue.substring(0, lineBreakIndex);
            return { text: `${truncatedValue}${ellipsis}`, truncated: true };
        }

        if (completeWords) {
            const lastSpaceIndex = truncatedValue.lastIndexOf(' ');
            if (lastSpaceIndex !== -1 && lastSpaceIndex <= 177) {
                limit = lastSpaceIndex;
                truncatedValue = value.substring(0, limit);
            }
        }

        return { text: `${truncatedValue.substring(0, Math.min(limit, 177))}${ellipsis}`, truncated: true };
    }

}
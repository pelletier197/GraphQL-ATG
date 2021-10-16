/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
export class GraphQLQueryError extends Error {
    constructor(message, response) {
        const errorsFormatted = response.errors
            ?.map((error) => `\t- ${error.message}`)
            ?.join('\n');
        super(`
${message}
--------------------------------
Data: ${response.data}
Errors: 
${errorsFormatted}
    `);
        this.response = response;
    }
}

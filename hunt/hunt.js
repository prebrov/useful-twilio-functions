exports.handler = function(context, event, callback) {
    const PHONE_NUMBERS = context.PHONE_NUMBERS || event.PHONE_NUMBERS;
    const FINAL_URL = context.FINAL_URL || event.FINAL_URL;

    const numbers = PHONE_NUMBERS.split(',').map(number => number.trim());
    const response = new Twilio.twiml.VoiceResponse();

    if (event.DialCallStatus === 'complete') {
        // Call was answered and completed
        response.hangup();
    } else if (event.finished === 'true') {
        if (FINAL_URL) {
            response.redirect(FINAL_URL);
        } else {
            response.hangup();
        }
    } else {
        const numberToDial = event.nextNumber ? event.nextNumber : numbers[0];
        const currentNumberIndex = numbers.indexOf(numberToDial);
        let url;
        if (currentNumberIndex + 1 === numbers.length) {
            // No more numbers to call after this.
            url = '/hunt?finished=true&PHONE_NUMBERS=' + encodeURIComponent(PHONE_NUMBERS);
        } else {
            const nextNumber = numbers[currentNumberIndex + 1];
            url = '/hunt?nextNumber=' + encodeURIComponent(nextNumber) + '&PHONE_NUMBERS=' + encodeURIComponent(PHONE_NUMBERS);
        }
        const dial = response.dial({
            action: 'https://' + context.DOMAIN_NAME + url,
            timeout: 10,
        });

        if (numberToDial.indexOf('@') > 0) {
            dial.sip(numberToDial);
        } else if (numberToDial.indexOf('+') === 0) {
            dial.number(numberToDial);
        }
        else {
            dial.sim(numberToDial);
        }
    }
    callback(null, response);
};
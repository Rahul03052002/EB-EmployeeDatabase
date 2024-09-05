const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Employees } = this.entities;

    // Before reading employees, filter to select only employees with positive blood groups
    this.before('READ', Employees, (req) => {
        if (!req.query.SELECT.where) {
            req.query.where({ BloodGroup: { in: ['A+', 'B+', 'AB+', 'O+'] } });
        }
    });
});

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/odata/v4/ODataModel"
], function (Controller, MessageBox, ODataModel) {
    "use strict";

    return Controller.extend("project1.controller.EmployeeView", {
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("employee").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sEmployeeId = oEvent.getParameter("arguments").employeeId;
            console.log("Employee ID:", sEmployeeId);
            this.getView().bindElement({
                path: "/Employees(" + sEmployeeId + ")",
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        this.getView().setBusy(true);
                    }.bind(this),
                    dataReceived: function () {
                        this.getView().setBusy(false);
                        var context = this.getView().getBindingContext();
                        console.log("Data received:", context ? context.getObject() : "No context");
                    }.bind(this)
                }
            });
        },

        _onBindingChange: function () {
            var oElementBinding = this.getView().getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                sap.ui.core.UIComponent.getRouterFor(this).getTargets().display("notFound");
            }
        },

        onDeletePress: function () {
            var oView = this.getView();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No context found for deletion.");
                return;
            }

            MessageBox.confirm("Are you sure you want to delete this employee?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        oContext.delete().then(function () {
                            MessageBox.success("Employee deleted successfully.");
                            // Navigate back to the previous page
                            // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                            // oRouter.navTo("RouteView1"); // replace with the actual route name
                        }.bind(this)).catch(function (error) {
                            MessageBox.error("Failed to delete the employee: " + error.message);
                        });
                    }
                }.bind(this)
            });
        },

        onUpdatePress: function () {
            var oView = this.getView();
            var oContext = oView.getBindingContext();
            var oModel = oView.getModel();

            if (!oContext) {
                MessageBox.error("No context found for updating.");
                return;
            }

            // Collect the updated values
            var sName = this.byId("nameInput").getValue();
            var sEmail = this.byId("emailInput").getValue();
            var sJobTitle = this.byId("jobTitleInput").getValue();
            var sBloodGroup = this.byId("bloodGroupInput").getValue();
            var sPhoneNumber = this.byId("phoneNumberInput").getValue();
            var sAddress = this.byId("addressInput").getValue();
            var sStartDate = this.byId("startDateInput").getDateValue();

            // Validation
            if (!sName || !sEmail || !sJobTitle || !sBloodGroup || !sPhoneNumber || !sAddress || !sStartDate) {
                MessageBox.error("Please fill all the fields.");
                return;
            }
            if (!sEmail.includes("@")) {
                MessageBox.error("Email must contain '@'.");
                return;
            }
            if (!/^\d{10}$/.test(sPhoneNumber)) {
                MessageBox.error("Phone number must be 10 digits.");
                return;
            }

            // Format the date to 'yyyy-MM-dd'
            var formatDate = function (date) {
                var day = String(date.getDate()).padStart(2, '0');
                var month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                var year = date.getFullYear();
                return year + '-' + month + '-' + day;
            };

            // Prepare the updated data
            var oUpdatedData = {
                name: sName,
                email: sEmail,
                jobTitle: sJobTitle,
                BloodGroup: sBloodGroup,
                phoneNumber: sPhoneNumber,
                address: sAddress,
                startDate: formatDate(sStartDate)
            };

            // Update the entity
            oContext.setProperty("name", sName);
            oContext.setProperty("email", sEmail);
            oContext.setProperty("jobTitle", sJobTitle);
            oContext.setProperty("BloodGroup", sBloodGroup);
            oContext.setProperty("phoneNumber", sPhoneNumber);
            oContext.setProperty("address", sAddress);
            oContext.setProperty("startDate", formatDate(sStartDate));

            oModel.submitBatch(oModel.getUpdateGroupId()).then(function () {
                MessageBox.success("Employee updated successfully.");
            }).catch(function (error) {
                MessageBox.error("Failed to update employee: " + error.message);
            });
        },
        onBackPress: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        
            // Navigate back to the view page
            oRouter.navTo("RouteView1");
        
            // Use Event Bus to notify the ListReportPage about the update
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.publish("abc", "Updated", { });
        }
        
         
    });
});

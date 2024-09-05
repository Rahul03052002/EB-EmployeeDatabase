sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v4/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/comp/smartvariants/PersonalizableInfo",
    "sap/m/Label",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/DatePicker",
    "sap/ui/model/json/JSONModel"

],
function (Controller, ODataModel, Filter, FilterOperator, Sorter, PersonalizableInfo, Label, MessageBox, Dialog, Button, Input,DatePicker,JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
            var oDataModel = new ODataModel({
                serviceUrl: "/odata/v4/catalog/",
                operationMode: "Server"
            });
            this.getView().setModel(oDataModel);

            this.oTable = this.byId("employeeTable");
            this._aFilters = [];
            this._aSorters = [];

            this.applyData = this.applyData.bind(this);
            this.fetchData = this.fetchData.bind(this);
            this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

            this.oSmartVariantManagement = this.getView().byId("svm");
            this.oExpandedLabel = this.getView().byId("expandedLabel");
            this.oSnappedLabel = this.getView().byId("snappedLabel");
            this.oFilterBar = this.getView().byId("filterbar");

            this.oFilterBar.registerFetchData(this.fetchData);
            this.oFilterBar.registerApplyData(this.applyData);
            this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

            var oPersInfo = new PersonalizableInfo({
                type: "filterBar",
                keyName: "persistencyKey",
                dataSource: "",
                control: this.oFilterBar
            });
            this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
            this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("abc", "Updated", this._onEmployeeUpdated, this);

            var oModel = new JSONModel({
                ID: "",
                name: "",
                email: "",
                jobTitle: "",
                BloodGroup: "",
                phoneNumber: "",
                address: "",
                startDate: null
            });
            this.getView().setModel(oModel, "newEmployee");
          
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var sPath = oItem.getBindingContext().getPath();
            var sEmployeeId = sPath.split("(")[1].split(")")[0];
            oRouter.navTo("employee", {
                employeeId: sEmployeeId
            });
        },
        _onEmployeeUpdated: function () {
            // Re-bind or refresh the data
            var oView = this.getView();
            var oTable = oView.byId("employeeTable"); // Replace with your table's ID
            if (oTable) {
                oTable.getBinding("items").refresh();
            }
        },
        onAdd: function () {
            if (!this.oDialog) {
                this.oDialog = new Dialog({
                    title: "Add Employee",
                    content: [
                        new Label({ text: "ID" }),
                        new Input({ value: "{newEmployee>/ID}" }),
                        new Label({ text: "Name" }),
                        new Input({ value: "{newEmployee>/name}" }),
                        new Label({ text: "Email" }),
                        new Input({ value: "{newEmployee>/email}" }),
                        new Label({ text: "Job Title" }),
                        new Input({ value: "{newEmployee>/jobTitle}" }),
                        new Label({ text: "Blood Group" }),
                        new Input({ value: "{newEmployee>/BloodGroup}" }),
                        new Label({ text: "Phone Number" }),
                        new Input({ value: "{newEmployee>/phoneNumber}" }),
                        new Label({ text: "Address" }),
                        new Input({ value: "{newEmployee>/address}" }),
                        new Label({ text: "Start Date" }),
                        new DatePicker({ value: "{newEmployee>/startDate}", valueFormat: "yyyy-MM-dd", displayFormat: "yyyy-MM-dd" })
                    ],
                    beginButton: new Button({
                        text: "Add",
                        press: function () {
                            this._addEmployee();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this.oDialog.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this.oDialog);
            }

            // Reset the dialog inputs
            this.getView().getModel("newEmployee").setData({
                ID: "",
                name: "",
                email: "",
                jobTitle: "",
                BloodGroup: "",
                phoneNumber: "",
                address: "",
                startDate: null
            });

            this.oDialog.open();
        },

        _addEmployee: function () {
            var oView = this.getView();
            var oListBinding = this.byId("employeeTable").getBinding("items");
            var oData = oView.getModel("newEmployee").getData();

            // Simple validation
            if (!oData.ID || !oData.name || !oData.email || !oData.jobTitle || !oData.BloodGroup || !oData.phoneNumber || !oData.address || !oData.startDate) {
                MessageBox.error("Please fill in all fields.");
                return;
            }

            // Validate ID as number
            var nID = parseInt(oData.ID, 10);
            if (isNaN(nID)) {
                MessageBox.error("ID must be a valid number.");
                return;
            }

            // Validate email format
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(oData.email)) {
                MessageBox.error("Please enter a valid email address.");
                return;
            }

            // Validate phone number to be at least 10 digits
            var phoneNumberPattern = /^\d{10,}$/;
            if (!phoneNumberPattern.test(oData.phoneNumber)) {
                MessageBox.error("Phone number must contain at least 10 digits.");
                return;
            }

            oData.ID = nID; // Ensure ID is a number

            console.log("Creating new employee with data:", oData);

            oListBinding.create(oData).created().then(function () {
                MessageBox.success("Employee added successfully!");
                this.oDialog.close();
                oListBinding.refresh();
            }).finally(function () {
                this.oDialog.close();
                oListBinding.refresh();
            }.bind(this));
            
        },
        onUpdate: function () {
            var oTable = this.byId("employeeTable");
            var aSelectedItems = oTable.getSelectedItems();
        
            if (aSelectedItems.length === 1) {
                var oContext = aSelectedItems[0].getBindingContext();
                var oProduct = oContext.getObject();
        
                // Create a dialog with controls
                var oInputDialog = new sap.m.Dialog({
                    title: "Update Product",
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "Name" }),
                                new sap.m.Input("inputName", {
                                    value: oProduct.name,
                                    placeholder: "Enter updated name",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Email" }),
                                new sap.m.Input("inputEmail", {
                                    value: oProduct.email,
                                    placeholder: "Enter updated email",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Job Title" }),
                                new sap.m.Input("inputJobTitle", {
                                    value: oProduct.jobTitle,
                                    placeholder: "Enter updated job title",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Blood Group" }),
                                new sap.m.Input("inputBloodGroup", {
                                    value: oProduct.bloodGroup,
                                    placeholder: "Enter updated blood group",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Phone Number" }),
                                new sap.m.Input("inputPhoneNumber", {
                                    value: oProduct.phoneNumber,
                                    placeholder: "Enter updated phone number",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Address" }),
                                new sap.m.Input("inputAddress", {
                                    value: oProduct.address,
                                    placeholder: "Enter updated address",
                                    required: true
                                }),
                                new sap.m.Label({ text: "Start Date" }),
                                new sap.m.Input("inputStartDate", {
                                    value: oProduct.startDate,
                                    placeholder: "Enter updated start date",
                                    type: "Date",
                                    required: true
                                })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Update",
                        press: function () {
                           
                            var oInputName = sap.ui.getCore().byId("inputName");
                            var oInputEmail = sap.ui.getCore().byId("inputEmail");
                            var oInputJobTitle = sap.ui.getCore().byId("inputJobTitle");
                            var oInputBloodGroup = sap.ui.getCore().byId("inputBloodGroup");
                            var oInputPhoneNumber = sap.ui.getCore().byId("inputPhoneNumber");
                            var oInputAddress = sap.ui.getCore().byId("inputAddress");
                            var oInputStartDate = sap.ui.getCore().byId("inputStartDate");
        
                            
                            var sUpdatedName = oInputName.getValue();
                            var sUpdatedEmail = oInputEmail.getValue();
                            var sUpdatedJobTitle = oInputJobTitle.getValue();
                            var sUpdatedBloodGroup = oInputBloodGroup.getValue();
                            var sUpdatedPhoneNumber = oInputPhoneNumber.getValue();
                            var sUpdatedAddress = oInputAddress.getValue();
                            var sUpdatedStartDate = oInputStartDate.getValue();
        
                            // Validate the input values
                            if (!sUpdatedName || !sUpdatedEmail || !sUpdatedJobTitle || !sUpdatedBloodGroup || !sUpdatedPhoneNumber || !sUpdatedAddress || !sUpdatedStartDate) {
                                sap.m.MessageBox.error("Please fill in all fields.");
                                return;
                            }
        
                            
                            if (sUpdatedPhoneNumber.length < 10) {
                                sap.m.MessageBox.error("Phone number must be at least 10 digits.");
                                return;
                            }
        
                            // Basic email validation
                            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailPattern.test(sUpdatedEmail)) {
                                sap.m.MessageBox.error("Please enter a valid email address.");
                                return;
                            }
        
                            // Set the new product properties
                            // oContext.setProperty("ID", nUpdatedID);
                            oContext.setProperty("name", sUpdatedName);
                            oContext.setProperty("email", sUpdatedEmail);
                            oContext.setProperty("jobTitle", sUpdatedJobTitle);
                            oContext.setProperty("BloodGroup", sUpdatedBloodGroup);
                            oContext.setProperty("phoneNumber", sUpdatedPhoneNumber);
                            oContext.setProperty("address", sUpdatedAddress);
                            oContext.setProperty("startDate", sUpdatedStartDate);
        
                            // Submit the changes to the model
                            oContext.getModel().submitBatch(oContext.getModel().getUpdateGroupId()).then(function () {
                                sap.m.MessageBox.success("Product updated successfully!");
        
                                // Refresh the table binding to ensure UI reflects changes
                                oTable.getBinding("items").refresh();
        
                                oInputDialog.close();
                            }).catch(function (error) {
                                sap.m.MessageBox.error("Failed to update product: " + error.message);
                            });
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            oInputDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oInputDialog.destroy();
                    }
                });
        
                oInputDialog.open();
            } else {
                sap.m.MessageBox.warning("Please select exactly one product to update.");
            }
        },
        onDelete: function () {
            var oTable = this.byId("employeeTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length > 0) {
                MessageBox.confirm("Are you sure you want to delete the selected product(s)?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            aSelectedItems.forEach(function (oItem) {
                                var oContext = oItem.getBindingContext();
                                oContext.delete().then(function () {
                                    MessageBox.success("Product deleted successfully!");
                                }).catch(function (error) {
                                    MessageBox.error("Failed to delete product: " + error.message);
                                });
                            });
                        }
                    }
                });
            } else {
                MessageBox.warning("Please select product(s) to delete.");
            }
        },

        onExit: function() {
            // Cleanup on exit to avoid memory leaks
            this.oModel = null;
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
        },

        fetchData: function () {
            // Fetch data from the filter bar for variant management
            var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
                aResult.push({
                    groupName: oFilterItem.getGroupName(),
                    fieldName: oFilterItem.getName(),
                    fieldData: oFilterItem.getControl().getSelectedKeys()
                });

                return aResult;
            }, []);

            return aData;
        },

        applyData: function (aData) {
            // Apply data to the filter bar for variant management
            aData.forEach(function (oDataObject) {
                var oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
                oControl.setSelectedKeys(oDataObject.fieldData);
            }, this);
        },

        getFiltersWithValues: function () {
            // Retrieve filter items with selected values
            var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();

                if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
                    aResult.push(oFilterGroupItem);
                }

                return aResult;
            }, []);

            return aFiltersWithValue;
        },

        onSelectionChange: function (oEvent) {
            // Handle selection change in filter controls
            this.oSmartVariantManagement.currentVariantSetModified(true);
            this.oFilterBar.fireFilterChange(oEvent);
        },

        onSearch: function () {
            var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl(),
                    aSelectedKeys = oControl.getSelectedKeys(),
                    sPath = oFilterGroupItem.getName(),
                    aFilters = aSelectedKeys.map(function (sSelectedKey) {
                        var oFilter;
                        console.log("Applying filter on path:", sPath, "with key:", sSelectedKey);
        
                        switch (sPath) {
                            case "ID": // Handle numeric fields
                                oFilter = new Filter({
                                    path: sPath,
                                    operator: FilterOperator.EQ,
                                    value1: parseInt(sSelectedKey, 10) // Convert to integer
                                });
                                break;
                            case "name": // Handle string fields
                                oFilter = new Filter({
                                    path: sPath,
                                    operator: FilterOperator.Contains,
                                    value1: sSelectedKey
                                });
                                break;
                            // Handle other cases if needed
                            default:
                                oFilter = new Filter({
                                    path: sPath,
                                    operator: FilterOperator.Contains,
                                    value1: sSelectedKey
                                });
                        }
        
                        return oFilter;
                    });
        
                if (aSelectedKeys.length > 0) {
                    aResult.push(new Filter({
                        filters: aFilters,
                        and: false
                    }));
                }
        
                return aResult;
            }, []);
        
            console.log("Applying filters:", aTableFilters);
            this._applyFiltersAndSorters(aTableFilters);
            this.oTable.setShowOverlay(false);
        },        

        onSort: function (oEvent) {
            // Handle sorting based on user selection
            var sKey = oEvent.getSource().getSelectedKey();
            this._aSorters = [];
            if (sKey) {
                this._aSorters.push(new Sorter(sKey));
            }
            this._applyFiltersAndSorters(this._aFilters);
        },

        _applyFiltersAndSorters: function (aFilters) {
            this._aFilters = aFilters || this._aFilters;
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
        
            if (oBinding) {
                // Log the filters and sorters being applied
                console.log("Applying filters:", this._aFilters);
                console.log("Applying sorters:", this._aSorters);
        
                // Remove leading/trailing spaces from field names in filters and sorters
                this._aFilters = this._aFilters.map(filter => {
                    if (filter.sPath) {
                        filter.sPath = filter.sPath.trim();
                    }
                    return filter;
                });
                this._aSorters = this._aSorters.map(sorter => {
                    if (sorter.sPath) {
                        sorter.sPath = sorter.sPath.trim();
                    }
                    return sorter;
                });
        
                // Clear previous filters and sorters
                oBinding.filter([]);
                oBinding.sort([]);
        
                // Apply new filters and sorters
                if (this._aFilters.length > 0) {
                    console.log("Filters before applying:", this._aFilters);
                    oBinding.filter(this._aFilters);
                }
                if (this._aSorters.length > 0) {
                    console.log("Sorters before applying:", this._aSorters);
                    oBinding.sort(this._aSorters);
                }
            } else {
                console.error("Table binding not found.");
            }
        },
        
        
        

        onFilterChange: function () {
            // Handle filter change event
            this._updateLabelsAndTable();
        },

        onAfterVariantLoad: function () {
            this._updateLabelsAndTable();
        },

        getFormattedSummaryText: function() {
            // Get formatted summary text for filters
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

            if (aFiltersWithValues.length === 0) {
                return "No filters active";
            }

            if (aFiltersWithValues.length === 1) {
                return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
            }

            return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
        },

        getFormattedSummaryTextExpanded: function() {
            // Get formatted summary text for expanded view
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

            if (aFiltersWithValues.length === 0) {
                return "No filters active";
            }

            var sText = aFiltersWithValues.length + " filters active",
                aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

            if (aFiltersWithValues.length === 1) {
                sText = aFiltersWithValues.length + " filter active";
            }

            if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
                sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
            }

            return sText;
        },

        _updateLabelsAndTable: function () {
            // Update labels and table based on filter changes
            this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
            this.oSnappedLabel.setText(this.getFormattedSummaryText());
            this.oTable.setShowOverlay(true);
        }
    });
});

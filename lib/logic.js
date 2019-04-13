/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var NS = 'org.example.ensure';

/**
 * Create Product transaction
 * @param {org.example.ensure.CreateProduct} createProduct
 * @transaction
 */

function createProduct(newproduct) {
    //defining a new product
    var product = getFactory().newResource(NS, 'Product', newproduct.productId);

    product.premium = newproduct.premium;
    product.cover = newproduct.cover;
    product.provider = newproduct.provider;

    if(!product.provider.products) {
        product.provider.products = [];
      }
    product.provider.products.push(product);
    
    return getAssetRegistry(NS + '.Product').then(function(registry){
        return registry.add(product);
    }).then(function() {
        return getParticipantRegistry(NS + '.InsuranceProvider');
    }).then(function(insuranceProviderRegistry){
        return insuranceProviderRegistry.update(newproduct.provider);
    });
}


/**
 * Buy Product transaction
 * @param {org.example.ensure.BuyProduct} buyProduct
 * @transaction
 */

function buyProduct(buyProduct) {
    var newOwner = buyProduct.patient;
    var product = buyProduct.product;
    if (newOwner.balance < product.premium) { 
        throw new Error('Insufficient funds for transaction.');
    }
    
    newOwner.balance -= product.premium;
    if (!newOwner.products) {
        newOwner.products = [];
    }
    newOwner.products.push(product);

    if (!product.buyers) {
        product.buyers = [];
    }
    product.buyers.push(newOwner);

    //event 
    var factory = getFactory();
    var basicEvent = factory.newEvent(NS, 'BasicEvent');
    basicEvent.detail = "hello theree";
    emit (basicEvent);

    return getParticipantRegistry (NS + '.Patient').then(function(patientRegistry) {
        return patientRegistry.update(newOwner);
    }).then(function() {
        return getAssetRegistry (NS + '.Product').then (function(productRegistry) {
            return productRegistry.update(product);
        })
    });
}

/**
 * Create Diagnosis transaction
 * @param {org.example.ensure.CreateDiagnosis} createDiagnosis
 * @transaction
 */

function createDiagnosis(createDiagnosis) {
    var doctor = createDiagnosis.doctor;
    var patient = createDiagnosis.patient;
    var diagnosisId = createDiagnosis.diagnosisId;
    //defining a new diagnosis
    var diagnosis = getFactory().newResource(NS, 'Diagnosis', diagnosisId);

    diagnosis.doctor = doctor;
    diagnosis.patient = patient;
    diagnosis.description = createDiagnosis.description; //could be a ipfs hash

    return getAssetRegistry(NS + '.Diagnosis').then (function(registry){
        registry.add(diagnosis);
    });
}

/**
 * Create Prescription transaction
 * @param {org.example.ensure.CreatePrescription} createPrescription
 * @transaction
 */
function createPrescription(createPrescription) {
    var doctor = createPrescription.doctor;
    var patient = createPrescription.patient;
    var prescriptionId = createPrescription.prescriptionId;
    //defining a new prescription
    var prescription = getFactory().newResource(NS, 'Prescription', prescriptionId);
    prescription.doctor = doctor;
    prescription.patient = patient;
    prescription.validityDays = createPrescription.validityDays; //optional
    prescription.description = createPrescription.description; //could be a ipfs hash
    prescription.validityDays = createPrescription.validityDays;
    prescription.pstatus = 'PENDING';
    var days_in_ms = 1000 * 60 * 60 * 24 * prescription.validityDays;
    prescription.validUntil = new Date (prescription.validityDays + days_in_ms);
    return getAssetRegistry(NS + '.Prescription').then (function(registry){
        registry.add(prescription);
    });
}

/**
 * Generate Bill transaction
 * @param {org.example.ensure.GenerateBill} generateBill
 * @transaction
 */
function generateBill(generateBill) {
    var billId = generateBill.billId;
    var description = generateBill.description;
    var patient = generateBill.patient;
    var doctor = generateBill.doctor;
    var amount = generateBill.amount;
    //defining a new bill
    var bill = getFactory().newResource(NS, 'Bill', billId);
    bill.billId = billId;
    bill.description = description;
    bill.patient = patient;
    bill.doctor = doctor;
    bill.amount = amount;
    return getAssetRegistry(NS + '.Bill').then (function(registry){
        registry.add(bill);
    });
}

/**
 * File a Claim transaction
 * @param {org.example.ensure.FileClaim} fileClaim
 * @transaction
 */
function fileClaim(fileClaim) {
    //creates a new Claim asset with status = PENDING
    var claimId = fileClaim.claimId;
    var type = fileClaim.type;
    if (type == 'REIMBURSEMENT') {
        if (!fileClaim.prescription) {
            throw new Error ('prescription asset required for reimbursement claims');
        }
        var prescription = fileClaim.prescription;
        if (!fileClaim.bill) {
            throw new Error ('bill asset required for reimbursement claims');
        }
        var bill = fileClaim.bill;
    }
    var patient = fileClaim.patient;
    var product = fileClaim.product;
    var doctor = fileClaim.doctor;
    var status = 'PENDING';

    var claim = getFactory().newResource(NS, 'Claim', claimId);
    
    if(type == 'REIMBURSEMENT') {
        claim.prescription = prescription;
        claim.bill = bill;
    }
    claim.patient = patient;
    claim.product = product;
    claim.status = status;
    claim.patient = patient;
    claim.doctor = doctor;
    claim.type = type;
    
    return getAssetRegistry(NS + '.Claim').then (function(registry){
        registry.add(claim);
    }).then (function() {
        //generate event 
        var event = getFactory().newEvent(NS, 'FileClaimEvent');
        //set properties
        event.claim = claim;
        event.patient = patient;
        event.doctor = doctor;
        emit (event);
    });
}

/**
 * Approve a Claim transaction
 * @param {org.example.ensure.ApproveClaim} approveClaim
 * @transaction
 */
function approveClaim(approveClaim) {
    var claim = approveClaim.claim;
    if (claim.status == 'REJECTED') {
        throw new Error ('Claim has been previously rejected.');
    }
    claim.status = 'APPROVED';
    if (claim.type == 'REIMBURSEMENT') {
        claim.prescription.pstatus = 'APPROVED';
    }
    //update the claim and prescription asset
    return getAssetRegistry(NS + '.Claim').then(function(registry){
        registry.update(claim);
    }).then(function() {
        getAssetRegistry(NS + '.Prescription').then(function(registry) {
            registry.update(claim.prescription);
        });
    }).then (function() {
        //generate event
        var event = getFactory().newEvent(NS, 'ClaimApproved');
        event.claim = claim;
        event.patient = claim.patient;
        emit (event);
    });
}

/**
 * Reject a Claim transaction
 * @param {org.example.ensure.RejectClaim} rejectClaim
 * @transaction
 */
function rejectClaim(rejectClaim) {
    var claim = rejectClaim.claim;
    if (claim.status == 'REJECTED') {
        throw new Error ('Claim has been previously rejected.');
    }
    claim.status = 'REJECTED';
    
    if (claim.type == 'REIMBURSEMENT') {
        claim.prescription.pstatus = 'REJECTED';
    }
    //update the claim and prescription asset
    return getAssetRegistry(NS + '.Claim').then(function(registry){
        registry.update(claim);
    }).then(function(){
        getAssetRegistry(NS + '.Prescription').then(function(registry) {
            registry.update(claim.prescription);
        });
    }).then (function () {
        //generate event
        var event = getFactory().newEvent (NS, 'ClaimRejected');
        event.claim = claim;
        event.patient = claim.patient;
        emit (event);
    });
}

/**
 * Settle a Claim transaction
 * @param {org.example.ensure.SettleClaim} settleClaim
 * @transaction
 */
function settleClaim(settleClaim) {
    var claim = settleClaim.claim;
    
    if (claim.status == 'REJECTED') {
        throw new Error ('Claim has been previously rejected.');
    }

    claim.status = 'SETTLED';
    claim.patient.balance += claim.product.cover;
    return getAssetRegistry(NS + '.Claim').then(function(registry) {
        registry.update(claim);
    }).then(function(){
        getParticipantRegistry(NS + '.Patient').then(function(registry){
            registry.update(claim.patient);
        });
    }).then(function() {
        var event = getFactory().newEvent(NS, 'ClaimSettled');
        event.claim = claim;
        event.patient = claim.patient;
        emit (event);
    });
} 

/**
 * Reject a Claim transaction
 * @param {org.example.ensure.RejectClaimFromProvider} rejectClaimP
 * @transaction
 */

function rejectClaimFromProvider (rejectClaimP) {
    var claim = rejectClaimP.claim;
    if (claim.status == 'REJECTED') {
        throw new Error ('Claim has been previously rejected.');
    }
    claim.status = 'REJECTED';
    return getAssetRegistry(NS + '.Claim').then(function(registry) {
        registry.update(claim);
    }).then(function() {
        var event = getFactory().newEvent(NS, 'ClaimRejected');
        event.claim = claim;
        event.patient = claim.patient;
        emit (event);
    });
} 

/**
 * Get meds transaction
 * @param {org.example.ensure.GetMeds} getMeds
 * @transaction
 */

function getMeds (getMeds) {
    var prescription = getMeds.prescription;
    var claim = getMeds.claim;
    var patient = getMeds.patient;
    var id = getMeds.reqId;

    var MedReq = getFactory().newResource(NS, 'MedReq', id);

    MedReq.prescription = prescription;
    MedReq.claim = claim;
    MedReq.patient = patient;

    return getAssetRegistry(NS + '.MedReq').then (function(registry){
        registry.add(MedReq);
    });
}

/**
 * complete med req transaction
 * @param {org.example.ensure.CompleteMedReq} completeMedReq
 * @transaction
 */

function completeMedReq (medReq) {
    var request = medReq.request;
    if (request.prescription.pstatus != 'APPROVED' || request.claim.status != 'SETTLED') {
        throw new Error ('transaction cannot take place');
    }

    if (request.prescription.validUntil > request.timestamp) {
        throw new Error ('prescription expired');
    }
    
    request.prescription.pstatus = 'CLAIMED';

    return getAssetRegistry(NS + '.Prescription').then(function(registry) {
        registry.update(request.prescription);
    })
}
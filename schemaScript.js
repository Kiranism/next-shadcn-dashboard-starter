// Hospitals Collection
db.createCollection('hospitals', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'hospitals',
      required: ['name', 'type', 'ownershipType', 'registerationNumber'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e8f9')"
        },
        name: { bsonType: 'string', example: 'City Hospital' },
        location: {
          bsonType: 'object',
          properties: {
            area: { bsonType: 'string', example: 'Gulberg' },
            city: { bsonType: 'string', example: 'Lahore' },
            country: { bsonType: 'string', example: 'Pakistan' },
            latitude: { bsonType: 'number', example: 31.5497 },
            longitude: { bsonType: 'number', example: 74.3436 }
          }
        },
        contact: {
          bsonType: 'object',
          properties: {
            primaryNumber: { bsonType: 'string', example: '+92-300-1234567' },
            secondaryNumber: {
              bsonType: 'string',
              example: '+92-42-111-222-333'
            }
          }
        },
        type: {
          enum: ['hospital', 'clinic', 'dispensary', 'ngo', 'other'],
          example: 'hospital'
        },
        ownershipType: {
          enum: ['public', 'private', 'semi-government', 'ngo'],
          example: 'private'
        },
        registerationNumber: { bsonType: 'string', example: 'REG123456' },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

// Patients Collection
db.createCollection('patients', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'patients',
      required: ['name', 'gender', 'dateOfBirth', 'cnic', 'cnicIV'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e2a4e1f2c3a5b6d7e905')"
        },
        name: { bsonType: 'string', example: 'Ali Khan' },
        gender: { enum: ['male', 'female', 'other'], example: 'male' },
        dateOfBirth: {
          bsonType: 'date',
          example: "ISODate('1990-05-12T00:00:00Z')"
        },
        cnic: { bsonType: 'string', example: '35202-1234567-8' },
        cnicIV: { bsonType: 'string', example: 'IVKey123' },
        bloodGroup: {
          enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
          example: 'B+'
        },
        contact: {
          bsonType: 'object',
          properties: {
            primaryNumber: { bsonType: 'string', example: '+92-300-7654321' },
            secondaryNumber: {
              bsonType: 'string',
              example: '+92-42-111-222-444'
            },
            address: { bsonType: 'string', example: '123 Main Street' },
            city: { bsonType: 'string', example: 'Lahore' },
            state: { bsonType: 'string', example: 'Punjab' }
          }
        },
        emergencyContact: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string', example: 'Sara Khan' },
            relation: { bsonType: 'string', example: 'Sister' },
            phoneNo: { bsonType: 'string', example: '+92-300-9876543' }
          }
        },
        medicalHistory: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              condition: { bsonType: 'string', example: 'Diabetes' },
              diagnosedAt: {
                bsonType: 'date',
                example: "ISODate('2015-03-20T00:00:00Z')"
              },
              status: {
                enum: ['active', 'recovered', 'chronic'],
                example: 'active'
              }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

// Doctors Collection
db.createCollection('doctors', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'doctors',
      required: ['_id', 'licenseNumber', 'name', 'cnic', 'cnicIV'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e3a4e1f2c3a5b6d7e907')"
        },
        name: { bsonType: 'string', example: 'Dr. Ahmed Raza' },
        gender: { enum: ['male', 'female', 'other'], example: 'male' },
        dateOfBirth: {
          bsonType: 'date',
          example: "ISODate('1980-11-10T00:00:00Z')"
        },
        cnic: { bsonType: 'string', example: '35202-7654321-0' },
        cnicIV: { bsonType: 'string', example: 'IVKey456' },
        specialization: { bsonType: 'string', example: 'Cardiology' },
        experienceYears: { bsonType: 'int', example: 15 },
        subSpecialization: {
          bsonType: 'array',
          items: { bsonType: 'string', example: 'Interventional Cardiology' }
        },
        qualifications: {
          bsonType: 'array',
          items: { bsonType: 'string', example: 'MBBS' }
        },
        licenseNumber: { bsonType: 'string', example: 'LIC123456' },
        contact: {
          bsonType: 'object',
          properties: {
            area: { bsonType: 'string', example: 'DHA' },
            city: { bsonType: 'string', example: 'Lahore' },
            state: { bsonType: 'string', example: 'Punjab' },
            primaryNumber: { bsonType: 'string', example: '+92-300-1122334' },
            secondaryNumber: {
              bsonType: 'string',
              example: '+92-42-111-333-444'
            }
          }
        },
        hospitalIds: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId',
            example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
          }
        },
        availability: {
          bsonType: 'object',
          properties: {
            days: {
              bsonType: 'array',
              items: {
                enum: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                ],
                example: 'Monday'
              }
            },
            timeSlots: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  start: { bsonType: 'string', example: '09:00' },
                  end: { bsonType: 'string', example: '17:00' }
                }
              }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

// Workers Collection
db.createCollection('workers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'workers',
      required: ['_id', 'name', 'designation', 'cnic', 'cnicIV'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e4a4e1f2c3a5b6d7e908')"
        },
        name: { bsonType: 'string', example: 'Sara Ahmed' },
        gender: { enum: ['Male', 'Female', 'Other'], example: 'Female' },
        dateOfBirth: {
          bsonType: 'date',
          example: "ISODate('1992-08-15T00:00:00Z')"
        },
        cnic: { bsonType: 'string', example: '35202-1122334-5' },
        cnicIV: { bsonType: 'string', example: 'IVKey789' },
        designation: {
          enum: ['Nurse', 'Paramedic', 'Technician', 'Other'],
          example: 'Nurse'
        },
        department: {
          enum: [
            'ICU',
            'Emergency',
            'Radiology',
            'General Ward',
            'Laboratory',
            'Other'
          ],
          example: 'ICU'
        },
        experienceYears: { bsonType: 'int', example: 5 },
        qualifications: {
          bsonType: 'array',
          items: { bsonType: 'string', example: 'BS Nursing' }
        },
        shift: {
          bsonType: 'object',
          properties: {
            type: {
              enum: ['Morning', 'Evening', 'Night', 'Rotational'],
              example: 'Morning'
            },
            startTime: { bsonType: 'string', example: '08:00' },
            endTime: { bsonType: 'string', example: '16:00' }
          }
        },
        contact: {
          bsonType: 'object',
          properties: {
            primaryNumber: { bsonType: 'string', example: '+92-300-4455667' },
            secondaryNumber: {
              bsonType: 'string',
              example: '+92-42-111-555-666'
            },
            area: { bsonType: 'string', example: 'Model Town' },
            city: { bsonType: 'string', example: 'Lahore' },
            state: { bsonType: 'string', example: 'Punjab' }
          }
        },
        hospitalIds: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId',
            example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
          }
        },
        licenseNumber: { bsonType: 'string', example: 'LIC987654' },
        schemes: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              name: { bsonType: 'string', example: 'Health Awareness Program' },
              organization: { bsonType: 'string', example: 'Red Cross' },
              role: { bsonType: 'string', example: 'Coordinator' },
              startDate: {
                bsonType: 'date',
                example: "ISODate('2024-01-01T00:00:00Z')"
              },
              endDate: {
                bsonType: 'date',
                example: "ISODate('2024-12-31T00:00:00Z')"
              },
              remarks: { bsonType: 'string', example: 'Successfully completed' }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

// Medical Records Collection
db.createCollection('medicalRecords', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'medicalRecords',
      required: ['_id', 'patientId', 'doctorId', 'hospitalId'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e5a4e1f2c3a5b6d7e909')"
        },
        patientId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e2a4e1f2c3a5b6d7e905')"
        },
        doctorId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e3a4e1f2c3a5b6d7e907')"
        },
        hospitalId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
        },
        visitDate: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T14:30:00Z')"
        },
        diagnosis: { bsonType: 'string', example: 'Hypertension' },
        symptoms: {
          bsonType: 'array',
          items: { bsonType: 'string', example: 'Headache' }
        },
        prescriptions: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              medicineName: { bsonType: 'string', example: 'Amlodipine' },
              dosage: { bsonType: 'string', example: '5mg' },
              frequency: { bsonType: 'string', example: 'Once Daily' },
              duration: { bsonType: 'string', example: '30 days' },
              notes: { bsonType: 'string', example: 'Take after breakfast' }
            }
          }
        },
        testsOrdered: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              testName: { bsonType: 'string', example: 'Blood Pressure Test' },
              results: { bsonType: 'string', example: '140/90 mmHg' },
              testDate: {
                bsonType: 'date',
                example: "ISODate('2025-11-01T15:00:00Z')"
              }
            }
          }
        },
        allergies: {
          bsonType: 'array',
          items: { bsonType: 'string', example: 'Penicillin' }
        },
        treatmentPlan: {
          bsonType: 'string',
          example: 'Daily medication and low-salt diet'
        },
        followUpDate: {
          bsonType: 'date',
          example: "ISODate('2025-11-15T14:30:00Z')"
        },
        notes: {
          bsonType: 'string',
          example: 'Patient advised to monitor blood pressure daily'
        },
        attachments: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              fileName: { bsonType: 'string', example: 'lab_report.pdf' },
              fileUrl: {
                bsonType: 'string',
                example: 'https://example.com/lab_report.pdf'
              },
              fileType: { bsonType: 'string', example: 'pdf' }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T14:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T14:30:00Z')"
        }
      }
    }
  }
});

// Bills Collection
db.createCollection('bills', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'bills',
      required: [
        '_id',
        'patientId',
        'hospitalId',
        'billDate',
        'totalAmount',
        'paidAmount',
        'status',
        'paymentMethod'
      ],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e6a4e1f2c3a5b6d7e910')"
        },
        patientId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e2a4e1f2c3a5b6d7e905')"
        },
        hospitalId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
        },
        doctorId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e3a4e1f2c3a5b6d7e907')"
        },
        medicalRecordId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e5a4e1f2c3a5b6d7e909')"
        },
        billDate: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T16:00:00Z')"
        },
        totalAmount: { bsonType: 'double', example: 1200.5 },
        paidAmount: { bsonType: 'double', example: 1000.5 },
        status: {
          enum: ['Pending', 'Paid', 'Partial', 'Cancelled'],
          example: 'Partial'
        },
        paymentMethod: {
          enum: ['Cash', 'Card', 'Bank Transfer', 'Insurance'],
          example: 'Card'
        },
        items: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              description: { bsonType: 'string', example: 'Blood Test' },
              quantity: { bsonType: 'int', example: 1 },
              unitPrice: { bsonType: 'double', example: 200.0 },
              amount: { bsonType: 'double', example: 200.0 }
            }
          }
        },
        discount: { bsonType: 'double', example: 50.0 },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T16:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-01T16:30:00Z')"
        }
      }
    }
  }
});

// Appointments Collection
db.createCollection('appointments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'appointments',
      required: [
        '_id',
        'patientId',
        'doctorId',
        'hospitalId',
        'appointmentDate',
        'status'
      ],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e7a4e1f2c3a5b6d7e911')"
        },
        patientId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e2a4e1f2c3a5b6d7e905')"
        },
        doctorId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e3a4e1f2c3a5b6d7e907')"
        },
        hospitalId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
        },
        appointmentDate: {
          bsonType: 'date',
          example: "ISODate('2025-11-10T10:00:00Z')"
        },
        status: {
          enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
          example: 'Scheduled'
        },
        reason: { bsonType: 'string', example: 'Regular checkup' },
        priority: { enum: ['Normal', 'Urgent'], example: 'Normal' },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T12:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T12:00:00Z')"
        }
      }
    }
  }
});

// Facilities Collection
db.createCollection('facilities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'facilities',
      required: ['_id', 'hospitalId', 'category', 'name', 'quantity', 'status'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e8a4e1f2c3a5b6d7e912')"
        },
        hospitalId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
        },
        category: {
          enum: ['Equipment', 'Medication', 'Facility'],
          example: 'Equipment'
        },
        name: { bsonType: 'string', example: 'MRI Machine' },
        quantity: { bsonType: 'int', example: 2 },
        inUse: { bsonType: 'int', example: 1 },
        status: {
          enum: ['Operational', 'Out of Service', 'Under Maintenance'],
          example: 'Operational'
        },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

db.createCollection('capacity', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'capacity',
      required: ['_id', 'hospitalId', 'wardType', 'totalBeds', 'occupiedBeds'],
      properties: {
        _id: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e9a4e1f2c3a5b6d7e913')"
        },
        hospitalId: {
          bsonType: 'objectId',
          example: "ObjectId('64f8e1a4e1f2c3a5b6d7e900')"
        },
        wardType: {
          bsonType: 'string',
          enum: [
            'VIP',
            'Normal',
            'Emergency',
            'ICU',
            'Maternity',
            'Pediatrics',
            'Other'
          ],
          example: 'VIP'
        },
        totalBeds: { bsonType: 'int', example: 20 },
        occupiedBeds: { bsonType: 'int', example: 15 },
        availableBeds: {
          bsonType: 'int',
          example: 5,
          description: 'Automatically calculated as totalBeds - occupiedBeds'
        },
        equipmentIds: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId',
            example: "ObjectId('64f8e8a4e1f2c3a5b6d7e912')"
          }
        },
        notes: { bsonType: 'string', example: 'VIP ward under renovation' },
        createdAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        },
        updatedAt: {
          bsonType: 'date',
          example: "ISODate('2025-11-05T10:00:00Z')"
        }
      }
    }
  }
});

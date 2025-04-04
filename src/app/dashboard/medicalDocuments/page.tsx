'use client';
import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  IconSearch,
  IconPlus,
  IconDownload,
  IconPrinter,
  IconFileText,
  IconPill,
  IconCalendarStats,
  IconStethoscope,
  IconUserCircle,
  IconFileCheck,
  IconClock,
  IconAlertCircle,
  IconFilter,
  IconShare,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';

// Liste prédéfinie des patients
const patientsList = [
  { id: 1, name: 'Sophie Martin', age: 34, lastVisit: '2025-03-28' },
  { id: 2, name: 'Thomas Bernard', age: 45, lastVisit: '2025-04-01' },
  { id: 3, name: 'Marie Dubois', age: 29, lastVisit: '2025-03-15' },
  { id: 4, name: 'Jean Dupont', age: 52, lastVisit: '2025-03-22' },
  { id: 5, name: 'Claire Lefebvre', age: 37, lastVisit: '2025-04-02' },
  { id: 6, name: 'Philippe Robert', age: 63, lastVisit: '2025-03-18' },
  { id: 7, name: 'Émilie Leroy', age: 41, lastVisit: '2025-03-25' }
];

// Liste prédéfinie des médicaments
const medicationsList = [
  {
    id: 1,
    name: 'Paracétamol 500mg',
    category: 'Antalgique',
    dosageOptions: ['1 comprimé toutes les 6h', '2 comprimés toutes les 8h']
  },
  {
    id: 2,
    name: 'Amoxicilline 1g',
    category: 'Antibiotique',
    dosageOptions: [
      '1 comprimé matin et soir pendant 7 jours',
      '1 comprimé 3 fois par jour pendant 5 jours'
    ]
  },
  {
    id: 3,
    name: 'Ibuprofène 400mg',
    category: 'Anti-inflammatoire',
    dosageOptions: ['1 comprimé 3 fois par jour', '1 comprimé matin et soir']
  },
  {
    id: 4,
    name: 'Oméprazole 20mg',
    category: 'Anti-ulcéreux',
    dosageOptions: ['1 comprimé avant le petit déjeuner', '1 comprimé le soir']
  },
  {
    id: 5,
    name: 'Ventoline 100µg',
    category: 'Bronchodilatateur',
    dosageOptions: [
      '2 inhalations en cas de crise',
      '2 inhalations matin et soir'
    ]
  },
  {
    id: 6,
    name: 'Lévothyrox 50µg',
    category: 'Hormone thyroïdienne',
    dosageOptions: ['1 comprimé le matin à jeun']
  },
  {
    id: 7,
    name: 'Amlodipine 5mg',
    category: 'Antihypertenseur',
    dosageOptions: ['1 comprimé le matin']
  },
  {
    id: 8,
    name: 'Doliprane 1000mg',
    category: 'Antalgique',
    dosageOptions: [
      '1 comprimé toutes les 8h',
      '1 sachet toutes les 6h si douleur'
    ]
  }
];

// Types de certificats médicaux prédéfinis
const certificateTypes = [
  {
    id: 1,
    name: "Certificat d'aptitude au sport",
    template:
      "Je soussigné(e), Docteur [DOCTOR_NAME], certifie avoir examiné [PATIENT_NAME], né(e) le [BIRTH_DATE], et n'avoir pas constaté ce jour de contre-indication à la pratique du sport en compétition."
  },
  {
    id: 2,
    name: "Certificat d'arrêt de travail",
    template:
      'Je soussigné(e), Docteur [DOCTOR_NAME], certifie avoir examiné [PATIENT_NAME], né(e) le [BIRTH_DATE], et prescris un arrêt de travail de [DURATION] jours à compter du [START_DATE].'
  },
  {
    id: 3,
    name: "Certificat médical pour l'école",
    template:
      'Je soussigné(e), Docteur [DOCTOR_NAME], certifie avoir examiné [PATIENT_NAME], né(e) le [BIRTH_DATE], qui présente un état de santé compatible avec la fréquentation scolaire.'
  },
  {
    id: 4,
    name: 'Certificat de non contre-indication à la conduite',
    template:
      "Je soussigné(e), Docteur [DOCTOR_NAME], certifie avoir examiné [PATIENT_NAME], né(e) le [BIRTH_DATE], et n'avoir pas constaté ce jour de contre-indication médicale à la conduite automobile."
  }
];

// Liste des documents existants
const mockCertificates = [
  {
    id: 1,
    type: 'Certificat',
    title: "Certificat d'aptitude au sport",
    patientName: 'Sophie Martin',
    date: '2025-03-28',
    doctor: 'Dr. Laurent'
  },
  {
    id: 2,
    type: 'Certificat',
    title: "Certificat d'arrêt de travail",
    patientName: 'Thomas Bernard',
    date: '2025-04-01',
    doctor: 'Dr. Moreau'
  },
  {
    id: 3,
    type: 'Certificat',
    title: "Certificat médical pour l'école",
    patientName: 'Marie Dubois',
    date: '2025-03-20',
    doctor: 'Dr. Laurent'
  }
];

const mockPrescriptions = [
  {
    id: 1,
    type: 'Prescription',
    title: 'Ordonnance médicaments',
    patientName: 'Jean Dupont',
    date: '2025-03-22',
    doctor: 'Dr. Petit',
    medications: ['Paracétamol 500mg', 'Ibuprofène 400mg']
  },
  {
    id: 2,
    type: 'Prescription',
    title: 'Ordonnance médicaments',
    patientName: 'Claire Lefebvre',
    date: '2025-04-02',
    doctor: 'Dr. Moreau',
    medications: ['Amoxicilline 1g']
  },
  {
    id: 3,
    type: 'Prescription',
    title: 'Ordonnance médicaments',
    patientName: 'Philippe Robert',
    date: '2025-03-30',
    doctor: 'Dr. Laurent',
    medications: ['Oméprazole 20mg', 'Doliprane 1000mg']
  }
];

// Composant Badge de type de document
const DocumentTypeBadge = ({ type }) => {
  const variants = {
    Certificat: {
      variant: 'outline',
      className: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    Prescription: {
      variant: 'outline',
      className: 'bg-green-100 text-green-800 border-green-300'
    }
  };

  const icons = {
    Certificat: <IconFileCheck size={14} className='mr-1' />,
    Prescription: <IconPill size={14} className='mr-1' />
  };

  return (
    <Badge
      variant={variants[type].variant}
      className={variants[type].className}
    >
      {icons[type]} {type}
    </Badge>
  );
};

export default function MedicalDocumentsPage() {
  const [activeTab, setActiveTab] = useState('certificates');
  const [search, setSearch] = useState('');
  const [certificates, setCertificates] = useState(mockCertificates);
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);

  // Modals
  const [showNewCertificateModal, setShowNewCertificateModal] = useState(false);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] =
    useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Form states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedCertificateType, setSelectedCertificateType] = useState('');
  const [certificateContent, setCertificateContent] = useState('');
  const [customFields, setCustomFields] = useState({
    doctorName: 'Dr. Laurent',
    duration: '',
    startDate: new Date().toISOString().split('T')[0],
    birthDate: ''
  });

  // Prescription form states
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  // Filter documents based on search
  const filteredCertificates = certificates.filter(
    (cert) =>
      search === '' ||
      cert.patientName.toLowerCase().includes(search.toLowerCase()) ||
      cert.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPrescriptions = prescriptions.filter(
    (presc) =>
      search === '' ||
      presc.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (presc.medications &&
        presc.medications.some((med) =>
          med.toLowerCase().includes(search.toLowerCase())
        ))
  );

  // Handle certificate type selection
  const handleCertificateTypeChange = (typeId) => {
    setSelectedCertificateType(typeId);
    const certType = certificateTypes.find(
      (cert) => cert.id === parseInt(typeId)
    );

    if (certType) {
      let content = certType.template;

      // Get patient details if selected
      if (selectedPatient) {
        const patient = patientsList.find(
          (p) => p.id === parseInt(selectedPatient)
        );
        if (patient) {
          content = content.replace('[PATIENT_NAME]', patient.name);
        }
      }

      // Replace doctor name
      content = content.replace('[DOCTOR_NAME]', customFields.doctorName);

      setCertificateContent(content);
    }
  };

  // Handle creating a new certificate
  const handleCreateCertificate = () => {
    if (selectedPatient && selectedCertificateType) {
      const patient = patientsList.find(
        (p) => p.id === parseInt(selectedPatient)
      );
      const certType = certificateTypes.find(
        (c) => c.id === parseInt(selectedCertificateType)
      );

      if (patient && certType) {
        // Process any custom fields in the content
        let finalContent = certificateContent;
        if (customFields.duration) {
          finalContent = finalContent.replace(
            '[DURATION]',
            customFields.duration
          );
        }
        if (customFields.startDate) {
          finalContent = finalContent.replace(
            '[START_DATE]',
            customFields.startDate
          );
        }
        if (customFields.birthDate) {
          finalContent = finalContent.replace(
            '[BIRTH_DATE]',
            customFields.birthDate
          );
        }

        const newCertificate = {
          id: certificates.length + 1,
          type: 'Certificat',
          title: certType.name,
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          doctor: customFields.doctorName,
          content: finalContent
        };

        setCertificates([newCertificate, ...certificates]);
        resetCertificateForm();
        setShowNewCertificateModal(false);
      }
    }
  };

  // Handle creating a new prescription
  const handleCreatePrescription = () => {
    if (selectedPatient && selectedMedications.length > 0) {
      const patient = patientsList.find(
        (p) => p.id === parseInt(selectedPatient)
      );

      if (patient) {
        const selectedMedicationNames = selectedMedications
          .map((medItem) => {
            const medication = medicationsList.find(
              (m) => m.id === parseInt(medItem.medicationId)
            );
            return medication ? `${medication.name} - ${medItem.dosage}` : '';
          })
          .filter(Boolean);

        const newPrescription = {
          id: prescriptions.length + 1,
          type: 'Prescription',
          title: 'Ordonnance médicaments',
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          doctor: customFields.doctorName,
          medications: selectedMedicationNames,
          notes: prescriptionNotes
        };

        setPrescriptions([newPrescription, ...prescriptions]);
        resetPrescriptionForm();
        setShowNewPrescriptionModal(false);
      }
    }
  };

  // Add a medication to the prescription
  const addMedicationToPrescription = (medicationId, dosage) => {
    setSelectedMedications([...selectedMedications, { medicationId, dosage }]);
  };

  // Remove a medication from the prescription
  const removeMedicationFromPrescription = (index) => {
    const updatedMedications = [...selectedMedications];
    updatedMedications.splice(index, 1);
    setSelectedMedications(updatedMedications);
  };

  // Reset forms
  const resetCertificateForm = () => {
    setSelectedPatient('');
    setSelectedCertificateType('');
    setCertificateContent('');
    setCustomFields({
      doctorName: 'Dr. Laurent',
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      birthDate: ''
    });
  };

  const resetPrescriptionForm = () => {
    setSelectedPatient('');
    setSelectedMedications([]);
    setPrescriptionNotes('');
    setCustomFields({
      doctorName: 'Dr. Laurent'
    });
  };

  // View document details
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentDetails(true);
  };

  // Delete document
  const handleDeleteDocument = (id, type) => {
    if (type === 'Certificat') {
      setCertificates(certificates.filter((cert) => cert.id !== id));
    } else {
      setPrescriptions(prescriptions.filter((presc) => presc.id !== id));
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Documents Médicaux
          </h2>
          <div className='flex gap-2'>
            <Dialog
              open={showNewCertificateModal}
              onOpenChange={setShowNewCertificateModal}
            >
              <DialogTrigger asChild>
                <Button className='flex items-center gap-1'>
                  <IconFileText size={16} />
                  Nouveau Certificat
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Créer un certificat médical</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un patient et complétez les informations
                    nécessaires.
                  </DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <label htmlFor='patient'>Patient</label>
                      <Select
                        value={selectedPatient}
                        onValueChange={setSelectedPatient}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner un patient' />
                        </SelectTrigger>
                        <SelectContent>
                          {patientsList.map((patient) => (
                            <SelectItem
                              key={patient.id}
                              value={patient.id.toString()}
                            >
                              {patient.name} ({patient.age} ans)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <label htmlFor='certType'>Type de certificat</label>
                      <Select
                        value={selectedCertificateType}
                        onValueChange={handleCertificateTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner un type' />
                        </SelectTrigger>
                        <SelectContent>
                          {certificateTypes.map((certType) => (
                            <SelectItem
                              key={certType.id}
                              value={certType.id.toString()}
                            >
                              {certType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedCertificateType && selectedCertificateType == 2 && (
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='grid gap-2'>
                        <label htmlFor='duration'>Durée (jours)</label>
                        <Input
                          id='duration'
                          type='number'
                          value={customFields.duration}
                          onChange={(e) =>
                            setCustomFields({
                              ...customFields,
                              duration: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className='grid gap-2'>
                        <label htmlFor='startDate'>Date de début</label>
                        <Input
                          id='startDate'
                          type='date'
                          value={customFields.startDate}
                          onChange={(e) =>
                            setCustomFields({
                              ...customFields,
                              startDate: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {selectedPatient && (
                    <div className='grid gap-2'>
                      <label htmlFor='birthDate'>Date de naissance</label>
                      <Input
                        id='birthDate'
                        type='date'
                        value={customFields.birthDate}
                        onChange={(e) =>
                          setCustomFields({
                            ...customFields,
                            birthDate: e.target.value
                          })
                        }
                      />
                    </div>
                  )}

                  <div className='grid gap-2'>
                    <label htmlFor='certContent'>Contenu du certificat</label>
                    <Textarea
                      id='certContent'
                      rows={6}
                      value={certificateContent}
                      onChange={(e) => setCertificateContent(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowNewCertificateModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateCertificate}>
                    Créer le certificat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showNewPrescriptionModal}
              onOpenChange={setShowNewPrescriptionModal}
            >
              <DialogTrigger asChild>
                <Button className='flex items-center gap-1' variant='secondary'>
                  <IconPill size={16} />
                  Nouvelle Ordonnance
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Créer une ordonnance</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un patient et les médicaments à prescrire.
                  </DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='patient'>Patient</label>
                    <Select
                      value={selectedPatient}
                      onValueChange={setSelectedPatient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner un patient' />
                      </SelectTrigger>
                      <SelectContent>
                        {patientsList.map((patient) => (
                          <SelectItem
                            key={patient.id}
                            value={patient.id.toString()}
                          >
                            {patient.name} ({patient.age} ans)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-2'>
                    <div className='flex items-center justify-between'>
                      <label>Médicaments</label>
                    </div>

                    <Card>
                      <CardContent className='p-4'>
                        <Accordion type='single' collapsible className='w-full'>
                          {medicationsList.map((medication) => (
                            <AccordionItem
                              key={medication.id}
                              value={`med-${medication.id}`}
                            >
                              <AccordionTrigger>
                                {medication.name}{' '}
                                <Badge variant='outline' className='ml-2'>
                                  {medication.category}
                                </Badge>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className='space-y-2 pt-2'>
                                  <div className='text-muted-foreground text-sm'>
                                    Posologie :
                                  </div>
                                  <RadioGroup
                                    onValueChange={(value) =>
                                      addMedicationToPrescription(
                                        medication.id,
                                        value
                                      )
                                    }
                                  >
                                    {medication.dosageOptions.map(
                                      (dosage, index) => (
                                        <div
                                          key={`dosage-${medication.id}-${index}`}
                                          className='flex items-center space-x-2'
                                        >
                                          <RadioGroupItem
                                            value={dosage}
                                            id={`dosage-${medication.id}-${index}`}
                                          />
                                          <Label
                                            htmlFor={`dosage-${medication.id}-${index}`}
                                          >
                                            {dosage}
                                          </Label>
                                        </div>
                                      )
                                    )}
                                  </RadioGroup>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedMedications.length > 0 && (
                    <div className='grid gap-2'>
                      <label>Médicaments sélectionnés</label>
                      <div className='border-border rounded-md border p-4'>
                        <ul className='space-y-2'>
                          {selectedMedications.map((medItem, index) => {
                            const medication = medicationsList.find(
                              (m) => m.id === parseInt(medItem.medicationId)
                            );
                            return medication ? (
                              <li
                                key={index}
                                className='flex items-center justify-between'
                              >
                                <div>
                                  <span className='font-medium'>
                                    {medication.name}
                                  </span>
                                  <span className='text-muted-foreground ml-2 text-sm'>
                                    ({medItem.dosage})
                                  </span>
                                </div>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    removeMedicationFromPrescription(index)
                                  }
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className='grid gap-2'>
                    <label htmlFor='notes'>Notes complémentaires</label>
                    <Textarea
                      id='notes'
                      rows={3}
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      placeholder='Instructions spéciales, recommandations...'
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowNewPrescriptionModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreatePrescription}>
                    Créer l'ordonnance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Certificats créés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {certificates.length}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconFileCheck className='size-4' /> Ce mois-ci
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Ordonnances émises</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {prescriptions.length}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconPill className='size-4' /> Ce mois-ci
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Patients concernés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {
                  new Set([
                    ...certificates.map((c) => c.patientName),
                    ...prescriptions.map((p) => p.patientName)
                  ]).size
                }
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconUserCircle className='size-4' /> Avec documents
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Documents aujourd'hui</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {
                  [...certificates, ...prescriptions].filter(
                    (doc) => doc.date === new Date().toISOString().split('T')[0]
                  ).length
                }
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconCalendarStats className='size-4' />{' '}
                {new Date().toLocaleDateString('fr-FR')}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Tabs and search */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full max-w-md grid-cols-2'>
                <TabsTrigger
                  value='certificates'
                  className='flex items-center gap-2'
                >
                  <IconFileText size={16} /> Certificats
                </TabsTrigger>
                <TabsTrigger
                  value='prescriptions'
                  className='flex items-center gap-2'
                >
                  <IconPill size={16} /> Ordonnances
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <IconSearch className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                <Input
                  type='search'
                  placeholder='Rechercher...'
                  className='w-full pl-8 sm:w-64'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Tabs>
            <TabsContent value='certificates' className='mt-0'>
              <Card>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Médecin</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-muted-foreground py-6 text-center'
                          >
                            Aucun certificat trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCertificates.map((certificate) => (
                          <TableRow key={certificate.id}>
                            <TableCell>
                              <DocumentTypeBadge type={certificate.type} />
                            </TableCell>
                            <TableCell className='font-medium'>
                              {certificate.title}
                            </TableCell>
                            <TableCell>{certificate.patientName}</TableCell>
                            <TableCell>
                              {new Date(certificate.date).toLocaleDateString(
                                'fr-FR'
                              )}
                            </TableCell>
                            <TableCell>{certificate.doctor}</TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2'>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() =>
                                    handleViewDocument(certificate)
                                  }
                                >
                                  <IconFileText size={18} />
                                </Button>
                                <Button variant='ghost' size='icon'>
                                  <IconPrinter size={18} />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() =>
                                    handleDeleteDocument(
                                      certificate.id,
                                      certificate.type
                                    )
                                  }
                                >
                                  <IconTrash size={18} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Tabs>
            <TabsContent value='prescriptions' className='mt-0'>
              <Card>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Médecin</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrescriptions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-muted-foreground py-6 text-center'
                          >
                            Aucune ordonnance trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPrescriptions.map((prescription) => (
                          <TableRow key={prescription.id}>
                            <TableCell>
                              <DocumentTypeBadge type={prescription.type} />
                            </TableCell>
                            <TableCell className='font-medium'>
                              {prescription.title}
                            </TableCell>
                            <TableCell>{prescription.patientName}</TableCell>
                            <TableCell>
                              {new Date(prescription.date).toLocaleDateString(
                                'fr-FR'
                              )}
                            </TableCell>
                            <TableCell>{prescription.doctor}</TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2'>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() =>
                                    handleViewDocument(prescription)
                                  }
                                >
                                  <IconFileText size={18} />
                                </Button>
                                <Button variant='ghost' size='icon'>
                                  <IconPrinter size={18} />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() =>
                                    handleDeleteDocument(
                                      prescription.id,
                                      prescription.type
                                    )
                                  }
                                >
                                  <IconTrash size={18} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Details Modal */}
      <Dialog open={showDocumentDetails} onOpenChange={setShowDocumentDetails}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <div className='flex items-center gap-2'>
              {selectedDocument && (
                <DocumentTypeBadge type={selectedDocument.type} />
              )}
              <DialogTitle>{selectedDocument?.title}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedDocument && (
                <div className='mt-2 flex items-center gap-4'>
                  <div className='flex items-center gap-1'>
                    <IconUserCircle size={14} />
                    <span>{selectedDocument.patientName}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconCalendarStats size={14} />
                    <span>
                      {new Date(selectedDocument.date).toLocaleDateString(
                        'fr-FR'
                      )}
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconStethoscope size={14} />
                    <span>{selectedDocument.doctor}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='max-h-[60vh]'>
            {selectedDocument?.type === 'Certificat' && (
              <div className='border-border bg-card rounded-md border p-4'>
                <p className='whitespace-pre-wrap'>
                  {selectedDocument.content}
                </p>
              </div>
            )}

            {selectedDocument?.type === 'Prescription' && (
              <div className='space-y-4'>
                <div>
                  <h4 className='mb-2 text-sm font-medium'>
                    Médicaments prescrits
                  </h4>
                  <ul className='border-border bg-card space-y-2 rounded-md border p-4'>
                    {selectedDocument.medications.map((med, index) => (
                      <li key={index} className='flex items-center gap-2'>
                        <IconPill size={16} className='text-primary' />
                        <span>{med}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedDocument.notes && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium'>
                      Notes complémentaires
                    </h4>
                    <div className='border-border bg-card rounded-md border p-4'>
                      <p className='whitespace-pre-wrap'>
                        {selectedDocument.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowDocumentDetails(false)}
              >
                Fermer
              </Button>
              <Button variant='secondary' className='flex items-center gap-1'>
                <IconPrinter size={16} />
                Imprimer
              </Button>
              <Button variant='secondary' className='flex items-center gap-1'>
                <IconDownload size={16} />
                Télécharger PDF
              </Button>
              <Button className='flex items-center gap-1'>
                <IconShare size={16} />
                Partager
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

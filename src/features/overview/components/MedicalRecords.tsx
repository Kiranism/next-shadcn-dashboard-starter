'use client';
import React, { useState } from 'react';
import {
  Search,
  Calendar,
  FileText,
  Phone,
  Mail,
  Plus,
  X,
  Activity,
  Clipboard,
  Heart,
  AlertCircle,
  FilePlus,
  User,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const patientData = [
  {
    id: 'P0001',
    name: 'Martin Dupont',
    email: 'martin.dupont@gmail.com',
    phone: '06 12 34 56 78',
    age: 45,
    gender: 'Homme',
    condition: 'Hypertension',
    lastVisit: '2023-12-15',
    nextAppointment: '2024-05-20',
    bloodType: 'A+',
    allergies: ['Pénicilline', 'Pollen'],
    medications: ['Lisinopril 10mg', 'Aspirine 75mg'],
    compliance: 85,
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    vitals: {
      bp: '138/85',
      pulse: 72,
      temp: '36.7°C',
      weight: '78 kg',
      height: '175 cm'
    }
  },
  {
    id: 'P0002',
    name: 'Sophie Lambert',
    email: 'sophie.lambert@gmail.com',
    phone: '07 23 45 67 89',
    age: 32,
    gender: 'Femme',
    condition: 'Grossesse',
    lastVisit: '2024-03-28',
    nextAppointment: '2024-04-15',
    bloodType: 'O-',
    allergies: ['Aucune'],
    medications: ['Acide folique 0.4mg'],
    compliance: 95,
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    vitals: {
      bp: '115/70',
      pulse: 80,
      temp: '36.5°C',
      weight: '65 kg',
      height: '168 cm'
    }
  },
  {
    id: 'P0003',
    name: 'Ahmed Benali',
    email: 'ahmed.benali@gmail.com',
    phone: '06 34 56 78 90',
    age: 68,
    gender: 'Homme',
    condition: 'Diabète type 2',
    lastVisit: '2024-04-01',
    nextAppointment: '2024-07-01',
    bloodType: 'B+',
    allergies: ['Fruits de mer', 'Sulfamides'],
    medications: ['Metformine 850mg', 'Atorvastatine 20mg'],
    compliance: 70,
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    vitals: {
      bp: '145/90',
      pulse: 78,
      temp: '36.6°C',
      weight: '82 kg',
      height: '172 cm'
    }
  },
  {
    id: 'P0004',
    name: 'Clara Morin',
    email: 'clara.morin@gmail.com',
    phone: '07 45 67 89 01',
    age: 28,
    gender: 'Femme',
    condition: 'Asthme',
    lastVisit: '2024-02-10',
    nextAppointment: '2024-05-10',
    bloodType: 'A-',
    allergies: ['Acariens', "Poils d'animaux"],
    medications: ['Salbutamol'],
    compliance: 90,
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    vitals: {
      bp: '120/75',
      pulse: 68,
      temp: '36.8°C',
      weight: '60 kg',
      height: '165 cm'
    }
  },
  {
    id: 'P0005',
    name: 'Martin Dupont',
    email: 'martin.dupont@gmail.com',
    phone: '06 12 34 56 78',
    age: 45,
    gender: 'Homme',
    condition: 'Hypertension',
    lastVisit: '2023-12-15',
    nextAppointment: '2024-05-20',
    bloodType: 'A+',
    allergies: ['Pénicilline', 'Pollen'],
    medications: ['Lisinopril 10mg', 'Aspirine 75mg'],
    compliance: 85,
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    vitals: {
      bp: '138/85',
      pulse: 72,
      temp: '36.7°C',
      weight: '78 kg',
      height: '175 cm'
    }
  },
  {
    id: 'P0006',
    name: 'Sophie Lambert',
    email: 'sophie.lambert@gmail.com',
    phone: '07 23 45 67 89',
    age: 32,
    gender: 'Femme',
    condition: 'Grossesse',
    lastVisit: '2024-03-28',
    nextAppointment: '2024-04-15',
    bloodType: 'O-',
    allergies: ['Aucune'],
    medications: ['Acide folique 0.4mg'],
    compliance: 95,
    avatar: 'https://api.slingacademy.com/public/sample-users/6.png',
    vitals: {
      bp: '115/70',
      pulse: 80,
      temp: '36.5°C',
      weight: '65 kg',
      height: '168 cm'
    }
  },
  {
    id: 'P0007',
    name: 'Ahmed Benali',
    email: 'ahmed.benali@gmail.com',
    phone: '06 34 56 78 90',
    age: 68,
    gender: 'Homme',
    condition: 'Diabète type 2',
    lastVisit: '2024-04-01',
    nextAppointment: '2024-07-01',
    bloodType: 'B+',
    allergies: ['Fruits de mer', 'Sulfamides'],
    medications: ['Metformine 850mg', 'Atorvastatine 20mg'],
    compliance: 70,
    avatar: 'https://api.slingacademy.com/public/sample-users/7.png',
    vitals: {
      bp: '145/90',
      pulse: 78,
      temp: '36.6°C',
      weight: '82 kg',
      height: '172 cm'
    }
  },
  {
    id: 'P0008',
    name: 'Clara Morin',
    email: 'clara.morin@gmail.com',
    phone: '07 45 67 89 01',
    age: 28,
    gender: 'Femme',
    condition: 'Asthme',
    lastVisit: '2024-02-10',
    nextAppointment: '2024-05-10',
    bloodType: 'A-',
    allergies: ['Acariens', "Poils d'animaux"],
    medications: ['Salbutamol'],
    compliance: 90,
    avatar: 'https://api.slingacademy.com/public/sample-users/8.png',
    vitals: {
      bp: '120/75',
      pulse: 68,
      temp: '36.8°C',
      weight: '60 kg',
      height: '165 cm'
    }
  }
];

// Map condition to status badge color and icon
const getConditionInfo = (condition) => {
  const conditionMap = {
    Sain: { color: 'bg-green-100 text-green-800', icon: Heart },
    Healthy: { color: 'bg-green-100 text-green-800', icon: Heart },
    'Diabète type 2': { color: 'bg-amber-100 text-amber-800', icon: Activity },
    Hypertension: { color: 'bg-amber-100 text-amber-800', icon: Activity },
    Asthme: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    Grossesse: { color: 'bg-purple-100 text-purple-800', icon: Heart }
  };

  return (
    conditionMap[condition] || {
      color: 'bg-gray-100 text-gray-800',
      icon: Clipboard
    }
  );
};

export default function MedicalRecordsTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = patientData.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Dossiers médicale des Patients</h1>
          <p className='text-muted-foreground'>
            Gérez les informations médicales de vos patients
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Nouveau Patient
        </Button>
      </div>

      <div className='flex items-center justify-end gap-4'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
          <Input
            placeholder='Rechercher un patient par nom ou ID...'
            className='!w-[20vw] pl-8'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='outline' size='icon'>
                <FilePlus className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Importer des dossiers</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Âge</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Dernière visite</TableHead>
                <TableHead>Prochain RDV</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => {
                const { color, icon: ConditionIcon } = getConditionInfo(
                  patient.condition
                );
                return (
                  <TableRow
                    key={patient.id}
                    className='cursor-pointer hover:bg-gray-50'
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <TableCell className='font-medium'>{patient.id}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-6 w-6'>
                          {/* <span className="text-xs">{patient.name.charAt(0)}{patient.name.split(' ')[1]?.charAt(0)}</span> */}
                          <AvatarImage src={patient.avatar} alt='Avatar' />
                          <AvatarFallback>
                            <span className='text-xs'>
                              {patient.name.charAt(0)}
                              {patient.name.split(' ')[1]?.charAt(0)}
                            </span>
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{patient.name}</p>
                          <p className='text-muted-foreground text-xs'>
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>
                      <Badge className={`${color}`}>
                        <ConditionIcon className='mr-1 h-3 w-3' />
                        {patient.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Clock className='text-muted-foreground h-3 w-3' />
                        {formatDate(patient.lastVisit)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Calendar className='text-muted-foreground h-3 w-3' />
                        {formatDate(patient.nextAppointment)}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientSelect(patient);
                        }}
                      >
                        <FileText className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientSelect(patient);
                        }}
                      >
                        {/* Nouvelle consultation */}
                        <Clipboard className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className='py-6 text-center'>
                    <p className='text-muted-foreground'>
                      Aucun patient trouvé
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className='flex justify-between border-t p-2'>
          <div className='text-muted-foreground text-sm'>
            Affichage de {filteredPatients.length} patients sur{' '}
            {patientData.length}
          </div>
          <div className='flex items-center gap-1'>
            <Button variant='outline' size='sm' disabled>
              Précédent
            </Button>
            <Button variant='outline' size='sm' className='w-8 p-0'>
              1
            </Button>
            <Button variant='outline' size='sm' disabled>
              Suivant
            </Button>
          </div>
        </CardFooter>
      </Card>
      {/* Patient Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='PatientModal !w-[80vw] overflow-hidden p-0'>
          {selectedPatient && (
            <div className='flex h-full flex-col'>
              <DialogHeader className='sticky top-0 z-10 border-b bg-white px-6 pt-6 pb-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='bg-primary text-primary-foreground h-10 w-10'>
                      <span>
                        {selectedPatient.name.charAt(0)}
                        {selectedPatient.name.split(' ')[1]?.charAt(0)}
                      </span>
                    </Avatar>
                    <div>
                      <DialogTitle className='flex items-center gap-2'>
                        {selectedPatient.name}
                        <Badge
                          className={
                            getConditionInfo(selectedPatient.condition).color
                          }
                        >
                          {selectedPatient.condition}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {selectedPatient.id} • {selectedPatient.gender} •{' '}
                        {selectedPatient.age} ans • Groupe sanguin:{' '}
                        {selectedPatient.bloodType}
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </DialogHeader>

              <Tabs
                defaultValue='info'
                className='flex flex-1 flex-col overflow-hidden'
              >
                <div className='border-b px-6'>
                  <TabsList className='h-12'>
                    <TabsTrigger
                      value='info'
                      className='data-[state=active]:bg-primary/10'
                    >
                      <User className='mr-2 h-4 w-4' />
                      Informations
                    </TabsTrigger>
                    <TabsTrigger
                      value='vitals'
                      className='data-[state=active]:bg-primary/10'
                    >
                      <Activity className='mr-2 h-4 w-4' />
                      Signes vitaux
                    </TabsTrigger>
                    <TabsTrigger
                      value='medical'
                      className='data-[state=active]:bg-primary/10'
                    >
                      <Clipboard className='mr-2 h-4 w-4' />
                      Dossier Médical
                    </TabsTrigger>
                    <TabsTrigger
                      value='appointments'
                      className='data-[state=active]:bg-primary/10'
                    >
                      <Calendar className='mr-2 h-4 w-4' />
                      Rendez-vous
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className='flex-1 p-6'>
                  <TabsContent value='info' className='mt-0 space-y-6'>
                    <div className='grid grid-cols-2 gap-8'>
                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>Coordonnées</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div className='flex items-center gap-2'>
                            <User className='text-muted-foreground h-4 w-4' />
                            <span>{selectedPatient.name}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Mail className='text-muted-foreground h-4 w-4' />
                            <span>{selectedPatient.email}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Phone className='text-muted-foreground h-4 w-4' />
                            <span>{selectedPatient.phone}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>Rendez-vous</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Dernière visite
                            </p>
                            <div className='mt-1 flex items-center gap-2'>
                              <Calendar className='text-muted-foreground h-4 w-4' />
                              <span>
                                {formatDate(selectedPatient.lastVisit)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Prochain rendez-vous
                            </p>
                            <div className='mt-1 flex items-center gap-2'>
                              <Calendar className='text-primary h-4 w-4' />
                              <span className='font-medium'>
                                {formatDate(selectedPatient.nextAppointment)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>
                          Informations personnelles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-3 gap-4'>
                          <div>
                            <p className='text-muted-foreground text-sm'>Âge</p>
                            <p className='font-medium'>
                              {selectedPatient.age} ans
                            </p>
                          </div>
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Genre
                            </p>
                            <p className='font-medium'>
                              {selectedPatient.gender}
                            </p>
                          </div>
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Groupe sanguin
                            </p>
                            <p className='font-medium'>
                              {selectedPatient.bloodType}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='vitals' className='mt-0 space-y-6'>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>
                          Signes vitaux actuels
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-3 gap-4'>
                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <p className='text-muted-foreground text-sm'>
                                Pression artérielle
                              </p>
                              <span className='text-sm font-medium'>
                                {selectedPatient.vitals.bp}
                              </span>
                            </div>
                            <Progress
                              value={parseInt(
                                selectedPatient.vitals.bp.split('/')[0]
                              )}
                              max={200}
                              className='h-2'
                            />
                          </div>
                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <p className='text-muted-foreground text-sm'>
                                Pouls
                              </p>
                              <span className='text-sm font-medium'>
                                {selectedPatient.vitals.pulse} bpm
                              </span>
                            </div>
                            <Progress
                              value={selectedPatient.vitals.pulse}
                              max={120}
                              className='h-2'
                            />
                          </div>
                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <p className='text-muted-foreground text-sm'>
                                Température
                              </p>
                              <span className='text-sm font-medium'>
                                {selectedPatient.vitals.temp}
                              </span>
                            </div>
                            <Progress
                              value={parseFloat(selectedPatient.vitals.temp)}
                              max={40}
                              className='h-2'
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className='grid grid-cols-2 gap-4'>
                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>
                            Mesures corporelles
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='grid grid-cols-2 gap-4'>
                            <div>
                              <p className='text-muted-foreground text-sm'>
                                Poids
                              </p>
                              <p className='font-medium'>
                                {selectedPatient.vitals.weight}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground text-sm'>
                                Taille
                              </p>
                              <p className='font-medium'>
                                {selectedPatient.vitals.height}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>
                            Conformité au traitement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          <Progress
                            value={selectedPatient.compliance}
                            className='h-2'
                          />
                          <div className='flex justify-between text-sm'>
                            <span>{selectedPatient.compliance}%</span>
                            <span className='text-muted-foreground'>
                              Dernière mise à jour:{' '}
                              {formatDate(selectedPatient.lastVisit)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className='text-muted-foreground rounded-lg border bg-gray-50 p-4 text-center'>
                      Graphique d'évolution des signes vitaux
                    </div>
                  </TabsContent>

                  <TabsContent value='medical' className='mt-0 space-y-6'>
                    <div className='grid grid-cols-2 gap-4'>
                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>Allergies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='flex flex-wrap gap-2'>
                            {selectedPatient.allergies.map((allergy, index) => (
                              <Badge
                                key={index}
                                variant='secondary'
                                className='py-1'
                              >
                                <AlertCircle className='mr-1 h-3 w-3' />
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm'>
                            Médicaments actuels
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='flex flex-wrap gap-2'>
                            {selectedPatient.medications.map(
                              (medication, index) => (
                                <Badge
                                  key={index}
                                  variant='outline'
                                  className='py-1'
                                >
                                  {medication}
                                </Badge>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center justify-between text-sm'>
                          <span>Historique des consultations</span>
                          <Button variant='outline' size='sm' className='h-7'>
                            <FilePlus className='mr-1 h-3 w-3' />
                            Ajouter
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-gray-50'>
                            <div className='flex items-center gap-2'>
                              <FileText className='text-primary h-4 w-4' />
                              <div>
                                <span className='font-medium'>
                                  Consultation de routine
                                </span>
                                <p className='text-muted-foreground text-xs'>
                                  Dr. Martin • Cabinet principal
                                </p>
                              </div>
                            </div>
                            <span className='text-muted-foreground text-sm'>
                              {formatDate(selectedPatient.lastVisit)}
                            </span>
                          </div>
                          <div className='flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-gray-50'>
                            <div className='flex items-center gap-2'>
                              <FileText className='text-primary h-4 w-4' />
                              <div>
                                <span className='font-medium'>
                                  Prise de sang
                                </span>
                                <p className='text-muted-foreground text-xs'>
                                  Laboratoire Central • Résultats disponibles
                                </p>
                              </div>
                            </div>
                            <span className='text-muted-foreground text-sm'>
                              {formatDate(
                                new Date(
                                  new Date(selectedPatient.lastVisit).setMonth(
                                    new Date(
                                      selectedPatient.lastVisit
                                    ).getMonth() - 3
                                  )
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='appointments' className='mt-0 space-y-6'>
                    <Card className='border-primary/20 border-2'>
                      <CardHeader className='bg-primary/5 pb-2'>
                        <CardTitle className='flex items-center text-sm'>
                          <Calendar className='text-primary mr-2 h-4 w-4' />
                          Prochain rendez-vous
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-lg font-medium'>
                              {formatDate(selectedPatient.nextAppointment)}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              10:30 • Dr. Sophie Martin • Consultation de suivi
                            </p>
                          </div>
                          <div className='flex gap-2'>
                            <Button size='sm' variant='outline'>
                              Modifier
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-red-500 hover:text-red-600'
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>
                          Historique des rendez-vous
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between rounded border bg-gray-50 p-2'>
                            <div className='flex items-center gap-2'>
                              <Calendar className='h-4 w-4' />
                              <div>
                                <span className='font-medium'>
                                  Consultation de routine
                                </span>
                                <p className='text-muted-foreground text-xs'>
                                  Dr. Martin • Terminé
                                </p>
                              </div>
                            </div>
                            <span className='text-sm'>
                              {formatDate(selectedPatient.lastVisit)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between rounded border bg-gray-50 p-2'>
                            <div className='flex items-center gap-2'>
                              <Calendar className='h-4 w-4' />
                              <div>
                                <span className='font-medium'>
                                  Prélèvement sanguin
                                </span>
                                <p className='text-muted-foreground text-xs'>
                                  Laboratoire • Terminé
                                </p>
                              </div>
                            </div>
                            <span className='text-sm'>
                              {formatDate(
                                new Date(
                                  new Date(selectedPatient.lastVisit).setMonth(
                                    new Date(
                                      selectedPatient.lastVisit
                                    ).getMonth() - 3
                                  )
                                )
                              )}
                            </span>
                          </div>
                        </div>

                        <div className='mt-4 flex justify-center'>
                          <Button className='w-full'>
                            <Calendar className='mr-2 h-4 w-4' />
                            Planifier un nouveau rendez-vous
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <DialogFooter className='border-t bg-gray-50 p-4'>
                <div className='flex w-full justify-between'>
                  <Button
                    variant='outline'
                    onClick={() => setIsModalOpen(false)}
                  >
                    Fermer
                  </Button>
                  <div className='flex gap-2'>
                    <Button variant='outline'>
                      <FilePlus className='mr-2 h-4 w-4' />
                      Rapport médical
                    </Button>
                    <Button>Modifier le dossier</Button>
                  </div>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

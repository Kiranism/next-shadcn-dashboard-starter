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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import {
  IconCalendar,
  IconSearch,
  IconFilter,
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconUser
} from '@tabler/icons-react';

// Mock data for appointments
const mockAppointments = [
  {
    id: 1,
    patientName: 'Sophie Martin',
    date: '2025-04-05',
    time: '09:00',
    service: 'Consultation',
    status: 'confirmed',
    doctor: 'Dr. Laurent'
  },
  {
    id: 2,
    patientName: 'Thomas Bernard',
    date: '2025-04-05',
    time: '10:30',
    service: 'Check-up',
    status: 'pending',
    doctor: 'Dr. Moreau'
  },
  {
    id: 3,
    patientName: 'Marie Dubois',
    date: '2025-04-05',
    time: '14:00',
    service: 'Téléconsultation',
    status: 'confirmed',
    doctor: 'Dr. Laurent'
  },
  {
    id: 4,
    patientName: 'Jean Dupont',
    date: '2025-04-06',
    time: '11:15',
    service: 'Examen',
    status: 'cancelled',
    doctor: 'Dr. Petit'
  },
  {
    id: 5,
    patientName: 'Claire Lefebvre',
    date: '2025-04-06',
    time: '15:45',
    service: 'Consultation',
    status: 'confirmed',
    doctor: 'Dr. Moreau'
  },
  {
    id: 6,
    patientName: 'Philippe Robert',
    date: '2025-04-07',
    time: '08:30',
    service: 'Check-up',
    status: 'confirmed',
    doctor: 'Dr. Petit'
  },
  {
    id: 7,
    patientName: 'Émilie Leroy',
    date: '2025-04-07',
    time: '13:00',
    service: 'Téléconsultation',
    status: 'pending',
    doctor: 'Dr. Laurent'
  }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const variants = {
    confirmed: {
      variant: 'outline',
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    pending: {
      variant: 'outline',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    cancelled: {
      variant: 'outline',
      className: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const statusText = {
    confirmed: 'Confirmé',
    pending: 'En attente',
    cancelled: 'Annulé'
  };

  return (
    <Badge
      variant={variants[status].variant}
      className={variants[status].className}
    >
      {statusText[status]}
    </Badge>
  );
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    date: '',
    time: '',
    service: '',
    doctor: '',
    status: 'pending'
  });

  // Filter appointments based on search and date
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      search === '' ||
      appointment.patientName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.service.toLowerCase().includes(search.toLowerCase()) ||
      appointment.doctor.toLowerCase().includes(search.toLowerCase());

    const matchesDate = filterDate === '' || appointment.date === filterDate;

    return matchesSearch && matchesDate;
  });

  // Handle creating a new appointment
  const handleAddAppointment = () => {
    if (
      newAppointment.patientName &&
      newAppointment.date &&
      newAppointment.time &&
      newAppointment.service &&
      newAppointment.doctor
    ) {
      setAppointments([
        ...appointments,
        {
          id: appointments.length + 1,
          ...newAppointment
        }
      ]);
      setNewAppointment({
        patientName: '',
        date: '',
        time: '',
        service: '',
        doctor: '',
        status: 'pending'
      });
      setShowAddDialog(false);
    }
  };

  // Handle deleting an appointment
  const handleDeleteAppointment = (id) => {
    setAppointments(
      appointments.filter((appointment) => appointment.id !== id)
    );
  };

  // Count appointments by status
  const confirmedCount = appointments.filter(
    (a) => a.status === 'confirmed'
  ).length;
  const pendingCount = appointments.filter(
    (a) => a.status === 'pending'
  ).length;
  const cancelledCount = appointments.filter(
    (a) => a.status === 'cancelled'
  ).length;
  const todayCount = appointments.filter((a) => a.date === '2025-04-05').length;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Gestion des Rendez-vous
          </h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-1'>
                <IconPlus size={16} />
                Nouveau Rendez-vous
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un rendez-vous</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau rendez-vous.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <label htmlFor='patient'>Patient</label>
                  <Input
                    id='patient'
                    value={newAppointment.patientName}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        patientName: e.target.value
                      })
                    }
                    placeholder='Nom du patient'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='date'>Date</label>
                    <Input
                      id='date'
                      type='date'
                      value={newAppointment.date}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          date: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='time'>Heure</label>
                    <Input
                      id='time'
                      type='time'
                      value={newAppointment.time}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          time: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className='grid gap-2'>
                  <label htmlFor='service'>Service</label>
                  <Select
                    onValueChange={(value) =>
                      setNewAppointment({ ...newAppointment, service: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un service' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Consultation'>Consultation</SelectItem>
                      <SelectItem value='Check-up'>Check-up</SelectItem>
                      <SelectItem value='Téléconsultation'>
                        Téléconsultation
                      </SelectItem>
                      <SelectItem value='Examen'>Examen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <label htmlFor='doctor'>Médecin</label>
                  <Select
                    onValueChange={(value) =>
                      setNewAppointment({ ...newAppointment, doctor: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un médecin' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Dr. Laurent'>Dr. Laurent</SelectItem>
                      <SelectItem value='Dr. Moreau'>Dr. Moreau</SelectItem>
                      <SelectItem value='Dr. Petit'>Dr. Petit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setShowAddDialog(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddAppointment}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous aujourd'hui</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {todayCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconCalendar className='size-4' /> 5 Avril 2025
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous confirmés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {confirmedCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <StatusBadge status='confirmed' />{' '}
                {Math.round((confirmedCount / appointments.length) * 100)}% du
                total
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous en attente</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {pendingCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <StatusBadge status='pending' />{' '}
                {Math.round((pendingCount / appointments.length) * 100)}% du
                total
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous annulés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {cancelledCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <StatusBadge status='cancelled' />{' '}
                {Math.round((cancelledCount / appointments.length) * 100)}% du
                total
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Filters and search */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <IconSearch className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
              <Input
                type='search'
                placeholder='Rechercher...'
                className='w-full pl-8 sm:w-64'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex items-center gap-2'>
              <IconFilter className='text-muted-foreground h-4 w-4' />
              <Input
                type='date'
                className='w-full sm:w-40'
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Médecin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-muted-foreground py-6 text-center'
                    >
                      Aucun rendez-vous trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className='font-medium'>
                        {appointment.patientName}
                      </TableCell>
                      <TableCell>
                        {new Date(appointment.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>{appointment.doctor}</TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button variant='ghost' size='icon'>
                            <IconEdit size={16} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              handleDeleteAppointment(appointment.id)
                            }
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className='flex justify-between py-4'>
            <div className='text-muted-foreground text-sm'>
              Affichage de {filteredAppointments.length} sur{' '}
              {appointments.length} rendez-vous
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled>
                Précédent
              </Button>
              <Button variant='outline' size='sm' disabled>
                Suivant
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Upcoming appointments section */}
        <div className='mt-6'>
          <h3 className='mb-4 text-lg font-medium'>Prochains rendez-vous</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {appointments
              .filter((a) => a.status === 'confirmed')
              .slice(0, 3)
              .map((appointment) => (
                <Card key={`upcoming-${appointment.id}`}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <IconUser size={18} />
                      {appointment.patientName}
                    </CardTitle>
                    <CardDescription className='flex items-center gap-2'>
                      <IconCalendar size={16} />
                      {new Date(appointment.date).toLocaleDateString('fr-FR')}
                      <IconClock size={16} className='ml-2' />
                      {appointment.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Service:</span>
                      <span>{appointment.service}</span>
                    </div>
                    <div className='mt-2 flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Médecin:</span>
                      <span>{appointment.doctor}</span>
                    </div>
                  </CardContent>
                  <CardFooter className='flex justify-end gap-2'>
                    <Button variant='outline' size='sm'>
                      Reprogrammer
                    </Button>
                    <Button size='sm'>Détails</Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

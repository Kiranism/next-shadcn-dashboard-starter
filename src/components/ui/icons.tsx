import { cn } from '@/lib/utils';
import {
  Moon,
  SunMedium,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShoppingCart,
  Check,
  MinusCircle,
  PlusCircle,
  LogIn,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  CircleUserRound,
  Phone,
  Upload,
  Edit,
  Pin,
  Mail,
  Truck,
  History,
  Settings,
  Hourglass,
  PackageCheck,
  PackageX,
  FolderCog,
  BadgeCheck,
  MapPin,
  Ticket,
  NotebookPen,
  TicketPercent,
  Receipt,
  Pencil,
  HandCoins,
  Trash,
  Camera,
  UploadCloud,
  XCircle,
  Paperclip,
  Calendar,
  Sparkles,
  LogOut,
  LoaderCircle,
  InfoIcon,
  MessagesSquare,
  Send,
  Sparkle,
  Flame,
  Search,
  Menu,
  FileText,
  Image,
  Link,
  Video,
  VideoOff,
  MicOff,
  Mic,
  PhoneOff,
  Minimize,
  Maximize,
  MessageSquare,
  MessageSquareOff,
  Hospital,
  HelpCircle,
  File,
  EllipsisVertical,
  Store,
  Rabbit,
  Squirrel,
  AlertTriangle,
  Bug,
  Cog,
  LifeBuoy,
  Headset,
  Inbox,
  Handshake,
  Key,
  CircleX,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Cake,
  MoreHorizontal,
  UserPlus,
  Users,
  Cloud,
  Code,
  FileUp,
  ImageUp,
  Telescope,
  Download,
  Home,
  Building,
  Files,
  Images,
  SVGAttributes,
  ListTodo,
  UserSearch,
  UserCog,
  CircleDollarSign,
  ChartArea,
  List,
  Play,
  Bell,
  Building2,
  Scale,
  FileX,
  Contact,
  Printer,
  User2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users2,
  ChevronsUpDown,
  Filter,
  RefreshCcw,
  Dot,
  Star,
  Briefcase,
  Presentation,
  Clock,
  CalendarDaysIcon,
  LucideCalendarClock,
  Landmark,
  UserCheck,
  UserX,
  FileCog,
  Factory,
  SquareCheck,
  SquareX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Copy,
  Save,
  ImageDown
} from 'lucide-react';
import React from 'react';

const YouTubeIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 -3.5 24 24'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M23.46 2.631A3 3 0 0 0 21.344.503C19.48 0 12 0 12 0S4.52 0 2.655.503A3 3 0 0 0 .541 2.631C.04 4.51.04 8.426.04 8.426s0 3.917.5 5.794a2.96 2.96 0 0 0 2.114 2.094c1.866.503 9.345.503 9.345.503s7.48 0 9.345-.503a2.96 2.96 0 0 0 2.114-2.094c.5-1.877.5-5.794.5-5.794s0-3.917-.5-5.795M9.553 11.982V4.87l6.251 3.557z'
      />
    </svg>
  )
);
YouTubeIcon.displayName = 'YouTubeIcon';

const InstagramIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 256 256'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('stroke-current', className)}
    >
      <path d='M128,82a46,46,0,1,0,46,46A46.05239,46.05239,0,0,0,128,82Zm0,68a22,22,0,1,1,22-22A22.02489,22.02489,0,0,1,128,150ZM176,20H80A60.06812,60.06812,0,0,0,20,80v96a60.06812,60.06812,0,0,0,60,60h96a60.06812,60.06812,0,0,0,60-60V80A60.06812,60.06812,0,0,0,176,20Zm36,156a36.04061,36.04061,0,0,1-36,36H80a36.04061,36.04061,0,0,1-36-36V80A36.04061,36.04061,0,0,1,80,44h96a36.04061,36.04061,0,0,1,36,36ZM196,76a16,16,0,1,1-16-16A16.01833,16.01833,0,0,1,196,76Z' />
    </svg>
  )
);
InstagramIcon.displayName = 'InstagramIcon';

const GenderIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      height={24}
      width={24}
      viewBox='0 0 640 512'
      fill='currentColor'
      className={cn(className, 'lucide lucide-gender fill-current')}
    >
      <path d='M176 288a112 112 0 1 0 0-224 112 112 0 1 0 0 224zM352 176c0 86.3-62.1 158.1-144 173.1l0 34.9 32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-32 0 0 32c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-32-32 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-34.9C62.1 334.1 0 262.3 0 176C0 78.8 78.8 0 176 0s176 78.8 176 176zM271.9 360.6c19.3-10.1 36.9-23.1 52.1-38.4c20 18.5 46.7 29.8 76.1 29.8c61.9 0 112-50.1 112-112s-50.1-112-112-112c-7.2 0-14.3 .7-21.1 2c-4.9-21.5-13-41.7-24-60.2C369.3 66 384.4 64 400 64c37 0 71.4 11.4 99.8 31l20.6-20.6L487 41c-6.9-6.9-8.9-17.2-5.2-26.2S494.3 0 504 0L616 0c13.3 0 24 10.7 24 24l0 112c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-33.4-33.4L545 140.2c19.5 28.4 31 62.7 31 99.8c0 97.2-78.8 176-176 176c-50.5 0-96-21.3-128.1-55.4z' />
    </svg>
  )
);
GenderIcon.displayName = 'GenderIcon';

const GitHubIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(className, 'lucide lucide-github fill-current')}
    >
      <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' />
      <path d='M9 18c-4.51 2-5-2-7-2' />
    </svg>
  )
);
GitHubIcon.displayName = 'GitHubIcon';

const AnalyticsIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'lucide lucide-chart-no-axes-combined fill-current',
        className
      )}
    >
      <path d='M12 16v5' />
      <path d='M16 14v7' />
      <path d='M20 10v11' />
      <path d='m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15' />
      <path d='M4 18v3' />
      <path d='M8 14v7' />
    </svg>
  )
);
AnalyticsIcon.displayName = 'AnalyticsIcon';

const PDFIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      height={24}
      width={24}
      className={cn(className, 'lucide fill-current')}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 512 512'
    >
      <path d='M64 464l48 0 0 48-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 304l-48 0 0-144-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z' />
    </svg>
  )
);
PDFIcon.displayName = 'PDFIcon';

const ExcelIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      height={24}
      width={24}
      className={cn(className, 'lucide fill-current')}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 384 512'
    >
      <path d='M48 448L48 64c0-8.8 7.2-16 16-16l160 0 0 80c0 17.7 14.3 32 32 32l80 0 0 288c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16zM64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-293.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0L64 0zm90.9 233.3c-8.1-10.5-23.2-12.3-33.7-4.2s-12.3 23.2-4.2 33.7L161.6 320l-44.5 57.3c-8.1 10.5-6.3 25.5 4.2 33.7s25.5 6.3 33.7-4.2L192 359.1l37.1 47.6c8.1 10.5 23.2 12.3 33.7 4.2s12.3-23.2 4.2-33.7L222.4 320l44.5-57.3c8.1-10.5 6.3-25.5-4.2-33.7s-25.5-6.3-33.7 4.2L192 280.9l-37.1-47.6z' />
    </svg>
  )
);
ExcelIcon.displayName = 'ExcelIcon';

const WordIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      height={24}
      width={24}
      className={cn(className, 'lucide fill-current')}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 384 512'
    >
      <path d='M48 448L48 64c0-8.8 7.2-16 16-16l160 0 0 80c0 17.7 14.3 32 32 32l80 0 0 288c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16zM64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-293.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0L64 0zm55 241.1c-3.8-12.7-17.2-19.9-29.9-16.1s-19.9 17.2-16.1 29.9l48 160c3 10.2 12.4 17.1 23 17.1s19.9-7 23-17.1l25-83.4 25 83.4c3 10.2 12.4 17.1 23 17.1s19.9-7 23-17.1l48-160c3.8-12.7-3.4-26.1-16.1-29.9s-26.1 3.4-29.9 16.1l-25 83.4-25-83.4c-3-10.2-12.4-17.1-23-17.1s-19.9 7-23 17.1l-25 83.4-25-83.4z' />
    </svg>
  )
);
WordIcon.displayName = 'WordIcon';

const SiteIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      className={cn('lucide fill-current', className)}
    >
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 121.99 100'>
        <path d='m41.71 30.89 14.31 23.56L28.27 100H0z' />
        <path fill='#e42b37' d='M61.78 60.73 39.79 100h44.15z' />
        <path d='M46.6 23.21 93.54 100h28.45L60.38 0z' />
      </svg>
    </svg>
  )
);
SiteIcon.displayName = 'SiteIcon';

const RunningLateIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      className={cn('lucide fill-current', className)}
      fill='#000000'
      height='24'
      width='24'
      version='1.1'
      id='Capa_1'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 486.187 486.187'
    >
      <g>
        <path
          d='M120.823,486.187c-6.993,0-33.645-4.961-33.645-33.316v-69.546c0-6.975,2.232-13.638,6.455-19.275l40.762-54.389
		l-15.108-50.692c-38.256,23.462-74.82,33.645-76.507,34.11c-17.476,4.803-35.729-5.834-41.458-22.397
		c-3.241-9.369-2.185-32.937,23.149-40.589c0.463-0.14,53.394-15.39,88.786-49.161c6.646-7.948,17.007-11.208,18.325-11.572
		l46.777-12.859c7.364-2.021,15.506-2.519,22.371,0.707c20.809,9.777,72.602,16.254,72.602,16.254
		c9.39,1.5,17.719,6.819,22.856,14.592L350.375,270c9.92,14.996,6.49,34.726-7.804,44.919c-5.839,4.162-29.007,15.414-48.227-8.657
		l-46.661-70.557l-7.561-1.207l18.365,61.637c0.99,2.541,17.062,39.266,27.74,63.566l43.646,29.124
		c15.012,8.528,22.795,24.452,17.587,39.746c-4.612,13.496-21.932,29.579-46.494,19.355l-60.809-28.235
		c-6.178-2.868-11.254-7.435-14.673-13.218l-28.714-48.56c-3.963-6.227-10.62-6.042-12.573-3.586l-29.73,39.67v59.461
		C154.467,471.504,139.375,486.187,120.823,486.187z M135.173,239.821l20.537,68.921c0.935,3.142,0.329,6.537-1.636,9.158
		l-43.883,58.556c-1.52,2.031-2.323,4.405-2.323,6.87v69.546c0,6.021,4.233,11.208,10.067,12.345
		c8.394,1.596,15.845-4.243,15.845-11.758v-62.905c0-2.238,0.727-4.414,2.066-6.203l34.332-45.812
		c13.384-12.555,36.962-4.511,44.398,8.844l28.714,48.56c1.279,2.157,3.208,3.884,5.577,4.981l60.824,28.239
		c7.932,4.315,16.173-1.363,18.189-7.268c1.843-5.419-1.123-11.319-8.88-15.45l-46.767-31.205c-1.642-1.096-2.935-2.637-3.728-4.445
		c-29.057-66.112-29.609-67.966-29.846-68.754L215.6,224.643c-2.37-10.738,7.083-14.03,11.546-13.168l28.291,4.515
		c2.858,0.455,5.399,2.092,6.995,4.506l49.167,74.35c3.879,5.864,12.98,7.501,18.961,3.222c5.172-3.687,6.298-11.001,2.56-16.653
		l-54.192-81.951c-1.954-2.955-5.182-4.986-8.854-5.577c0,0-50.005-5.846-76.093-17.123c-3.153-1.363-6.778-1.242-10.136-0.312
		l-46.772,12.859c-5.408,1.459-8.834,5.92-9.112,6.188c-39.114,37.594-95.561,53.784-97.928,54.52
		c-9.35,2.908-9.749,11.839-8.88,14.758c1.88,6.314,9.263,10.244,16.153,8.35c1.728-0.475,42.537-12.234,82.104-38.883
		C126.985,229.142,134.339,235.81,135.173,239.821z'
        />
        <path
          d='M133.39,150.414c-30.301,0-54.949-23.867-54.949-53.197c0-29.336,24.649-53.202,54.949-53.202
		c30.301,0,54.949,23.867,54.949,53.202C188.339,126.547,163.69,150.414,133.39,150.414z M133.39,64.703
		c-18.891,0-34.261,14.588-34.261,32.513s15.37,32.508,34.261,32.508c18.891,0,34.261-14.583,34.261-32.508
		S152.281,64.703,133.39,64.703z'
        />
        <path
          d='M389.161,187.231c-53.495,0-97.019-41.994-97.019-93.616C292.142,41.994,335.666,0,389.161,0s97.019,41.994,97.019,93.615
		C486.18,145.236,442.656,187.231,389.161,187.231z M389.161,20.689c-42.09,0-76.33,32.715-76.33,72.926
		c0,40.212,34.24,72.927,76.33,72.927c42.089,0,76.33-32.715,76.33-72.927C465.492,53.404,431.251,20.689,389.161,20.689z'
        />
        <polygon points='426.867,103.959 378.817,103.959 378.817,41.12 399.506,41.12 399.506,83.27 426.867,83.27 	' />
      </g>
    </svg>
  )
);
RunningLateIcon.displayName = 'RunningLateIcon';

const CategoryIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      className={cn(className, 'lucide fill-current')}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        opacity='.34'
        d='M5 10h2q3 0 3-3V5q0-3-3-3H5Q2 2 2 5v2q0 3 3 3'
        stroke='#292D32'
        strokeWidth='1.5'
        strokeMiterlimit='10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M17 10h2q3 0 3-3V5q0-3-3-3h-2q-3 0-3 3v2q0 3 3 3'
        stroke='#292D32'
        strokeWidth='1.5'
        strokeMiterlimit='10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        opacity='.34'
        d='M17 22h2q3 0 3-3v-2q0-3-3-3h-2q-3 0-3 3v2q0 3 3 3'
        stroke='#292D32'
        strokeWidth='1.5'
        strokeMiterlimit='10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5 22h2q3 0 3-3v-2q0-3-3-3H5q-3 0-3 3v2q0 3 3 3'
        stroke='#292D32'
        strokeWidth='1.5'
        strokeMiterlimit='10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
);
CategoryIcon.displayName = 'CategoryIcon';

const DistributionIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      className={cn('fill-current', className)}
      width='24'
      height='24'
      viewBox='18 24 64 52'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M62 20H38a.89.89 0 0 0-.87.88v2.91a.89.89 0 0 0 .87.88h24a.9.9 0 0 0 .87-.88v-2.91A.9.9 0 0 0 62 20m-18.71 7H38a.89.89 0 0 0-.87.88v1.74a.89.89 0 0 0 .87.88h5.25a.9.9 0 0 0 .88-.88v-1.74a.9.9 0 0 0-.84-.88m9.33 0h-5.24a.9.9 0 0 0-.88.88v1.74a.9.9 0 0 0 .88.88h5.24a.9.9 0 0 0 .88-.88v-1.74a.9.9 0 0 0-.88-.88M62 27h-5.29a.9.9 0 0 0-.88.88v1.74a.9.9 0 0 0 .88.88H62a.9.9 0 0 0 .87-.88v-1.74A.9.9 0 0 0 62 27m-18.71 5.83H38a.89.89 0 0 0-.87.88v1.75a.89.89 0 0 0 .87.87h5.25a.9.9 0 0 0 .88-.87v-1.75a.9.9 0 0 0-.84-.88m9.33 0h-5.24a.9.9 0 0 0-.88.88v1.75a.9.9 0 0 0 .88.87h5.24a.9.9 0 0 0 .88-.87v-1.75a.9.9 0 0 0-.88-.88m9.38 0h-5.29a.9.9 0 0 0-.88.88v1.75a.9.9 0 0 0 .88.87H62a.9.9 0 0 0 .87-.87v-1.75a.9.9 0 0 0-.87-.88m-18.71 5.84H38a.89.89 0 0 0-.87.87v1.75a.89.89 0 0 0 .87.88h5.25a.9.9 0 0 0 .88-.88v-1.75a.9.9 0 0 0-.84-.87m9.33 0h-5.24a.9.9 0 0 0-.88.87v1.75a.9.9 0 0 0 .88.88h5.24a.9.9 0 0 0 .88-.88v-1.75a.9.9 0 0 0-.88-.87m9.38 0h-5.29a.9.9 0 0 0-.88.87v1.75a.9.9 0 0 0 .88.88H62a.9.9 0 0 0 .87-.88v-1.75a.9.9 0 0 0-.87-.87M43.29 44.5H38a.89.89 0 0 0-.87.88v1.75A.89.89 0 0 0 38 48h5.25a.9.9 0 0 0 .88-.87v-1.75a.9.9 0 0 0-.84-.88m9.33 0h-5.24a.9.9 0 0 0-.88.88v1.75a.9.9 0 0 0 .88.87h5.24a.9.9 0 0 0 .88-.87v-1.75a.9.9 0 0 0-.88-.88m9.38 0h-5.29a.9.9 0 0 0-.88.88v1.75a.9.9 0 0 0 .88.87H62a.9.9 0 0 0 .87-.87v-1.75a.9.9 0 0 0-.87-.88m13.11 12.95H51.5v-5.32a1.5 1.5 0 1 0-3 0v5.32H24.89a1.5 1.5 0 0 0-1.5 1.5v7.86a1.5 1.5 0 0 0 3 0v-6.36H48.5v5.16a1.5 1.5 0 0 0 3 0v-5.16h22.11v6.36a1.5 1.5 0 0 0 3 0V59a1.5 1.5 0 0 0-1.5-1.55' />
      <circle cx='24.89' cy='74.71' r='4.89' />
      <circle cx='49.82' cy='74.71' r='4.89' />
      <circle cx='75.11' cy='74.71' r='4.89' />
    </svg>
  )
);
DistributionIcon.displayName = 'DistributionIcon';

const LawBuilding = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      className={cn(className, 'lucide fill-current')}
      width='24'
      height='24'
      viewBox='0 0 48 48'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g data-name='Layer 2'>
        <path fill='none' data-name='invisible box' d='M0 0h48v48H0z' />
        <path
          d='M5 36h38v4H5zm39 6H4a2 2 0 0 0-2 2v2h44v-2a2 2 0 0 0-2-2M10 18h4v16h-4zm12 0h4v16h-4zm12 0h4v16h-4zm10.9-6.6L24 2 3.1 11.4A2.1 2.1 0 0 0 2 13.2v.8a2 2 0 0 0 2 2h40a2 2 0 0 0 2-2v-.8a2.1 2.1 0 0 0-1.1-1.8m-33.3.6L24 6.4 36.4 12Z'
          data-name='Q3 icons'
        />
      </g>
    </svg>
  )
);
LawBuilding.displayName = 'LawBuilding';

const UserRole = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 32 32'
      className={cn(className, 'lucide fill-current')}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M28.07 21 22 15l6.07-6 1.43 1.41L24.86 15l4.64 4.59zM22 30h-2v-5a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v5H2v-5a7 7 0 0 1 7-7h6a7 7 0 0 1 7 7ZM12 4a5 5 0 1 1-5 5 5 5 0 0 1 5-5m0-2a7 7 0 1 0 7 7 7 7 0 0 0-7-7' />
      <path
        data-name='&lt;Transparent Rectangle&gt;'
        fill='none'
        d='M0 0h32v32H0z'
      />
    </svg>
  )
);
UserRole.displayName = 'UserRole';

const CalendarAlert = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      className={cn('lucide stroke-current', className)}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3 9h18m-9 3v3m0 3h.01M7 3v2m10-2v2M6.2 21h11.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C21 19.48 21 18.92 21 17.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C19.48 5 18.92 5 17.8 5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 6.52 3 7.08 3 8.2v9.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
);
CalendarAlert.displayName = 'CalendarAlert';

const DepartmentIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      className={cn('lucide', className)}
      xmlns='http://www.w3.org/2000/svg'
    >
      <g fill='none' fillRule='evenodd'>
        <path d='M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035q-.016-.005-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427q-.004-.016-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093q.019.005.029-.008l.004-.014-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014-.034.614q.001.018.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z' />
        <path
          d='M15 6a3 3 0 0 1-2 2.83V11h3a3 3 0 0 1 3 3v1.17a3.001 3.001 0 1 1-2 0V14a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1.17a3.001 3.001 0 1 1-2 0V14a3 3 0 0 1 3-3h3V8.83A3.001 3.001 0 1 1 15 6m-3-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2M6 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2m12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2'
          className='fill-current'
        />
      </g>
    </svg>
  )
);
DepartmentIcon.displayName = 'DepartmentIcon';

const IdCardIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      viewBox='0 0 433.362 433.362'
      xmlSpace='preserve'
      className={cn('lucide fill-current', className)}
    >
      <path d='M254.139 125.413V72.49l-19.025-19.025h-36.872L179.216 72.49v52.923H0v254.485h433.362V125.413zm-60.923-47.124 10.824-10.824h25.274l10.824 10.824v68.896h-46.923zm226.146 287.609H14V139.413h165.216v21.771h74.923v-21.771h165.224z' />
      <path d='M27.458 352.068h147.678V178.343H27.458zm40.729-106.955c0-18.26 14.851-33.116 33.104-33.116 18.261 0 33.116 14.856 33.116 33.116a33.09 33.09 0 0 1-22.472 31.359l.802 13.479c23.408 4.938 40.873 24.692 43.398 48.118H46.459c2.525-23.425 19.99-43.179 43.398-48.118l.802-13.479a33.09 33.09 0 0 1-22.472-31.359m92.949-52.77V309.39c-6.925-11.948-17.33-21.752-29.961-27.839a47.09 47.09 0 0 0 17.232-36.438c0-25.98-21.137-47.116-47.116-47.116-25.974 0-47.104 21.136-47.104 47.116a47.09 47.09 0 0 0 17.232 36.438c-12.63 6.087-23.036 15.891-29.961 27.839V192.343zm70.71 6.842h158.839v14H231.846zm0 46.744h158.839v14H231.846z' />
    </svg>
  )
);
IdCardIcon.displayName = 'IdCardIcon';

const EmployeeSalary = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 256 240'
      xmlSpace='preserve'
      className={cn('lucide fill-current', className)}
    >
      <path d='M84.635 20.256c18.383 0 33.286 14.903 33.286 33.286s-14.903 33.286-33.286 33.286-33.286-14.903-33.286-33.286 14.902-33.286 33.286-33.286M31.002 145.011c0-2.499 1.606-4.194 4.194-4.194s4.194 1.606 4.194 4.194v92.986h91.469v-92.986c0-2.499 1.606-4.194 4.194-4.194 2.499 0 4.194 1.606 4.194 4.194v92.986h29.092V136.623c0-22.934-18.74-41.585-41.585-41.585h-8.388l-24.451 38.015-2.945-28.467 4.016-9.638H76.96l4.016 9.638-3.123 28.645-24.452-38.193h-9.816C20.651 95.038 2 113.778 2 136.623v101.375h29.092v-92.986h-.09zM197.036 24.057 189.972 2h40.376l-8.659 22.057zm-30.943 46.437c0-17.044 9.433-31.763 23.606-39.1h40.422C244.293 38.73 254 53.45 254 70.494c0 24.153-19.687 43.84-43.84 43.84-24.426-.001-44.067-19.687-44.067-43.84m48.032 10.527c0 2.598-2.37 3.919-5.788 3.919-3.965 0-7.61-1.322-10.254-2.643l-1.823 7.064c2.324 1.322 6.289 2.37 10.481 2.643v5.788h6.015v-6.289c7.109-1.048 11.028-5.788 11.028-11.302s-2.917-8.886-10.254-11.53c-5.241-1.823-7.337-3.144-7.337-5.241 0-1.595 1.322-3.418 5.241-3.418 4.466 0 7.337 1.322 8.932 2.096l1.823-6.836c-2.096-1.048-4.739-1.823-8.932-2.096v-5.514h-6.015v5.742c-6.562 1.322-10.481 5.514-10.481 11.028 0 6.061 4.466 9.205 11.028 11.302 4.468 1.595 6.564 2.917 6.336 5.287' />
    </svg>
  )
);
EmployeeSalary.displayName = 'EmployeeSalary';

const CalendarMoney = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-calendar'
    >
      <path d='M8 2v4m8-4v4' />
      <rect width='18' height='18' x='3' y='4' rx='2' />
      <path d='M3 10h18' />
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='9'
        height='9'
        x='7.5'
        y='11.5'
        viewBox='0 0 24 24'
        className='lucide lucide-badge-dollar-sign'
      >
        <path d='M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76' />
        <path d='M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8m4 2V6' />
      </svg>
    </svg>
  )
);
CalendarMoney.displayName = 'CalendarMoney';

const AdminUserIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      className={cn('lucide fill-current', className)}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path fill='none' d='M0 0h24v24H0z' />
      <path d='M12 14v2a6 6 0 0 0-6 6H4a8 8 0 0 1 8-8m0-1c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6m0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m9 6h1v5h-8v-5h1v-1a3 3 0 0 1 6 0zm-2 0v-1a1 1 0 0 0-2 0v1z' />
    </svg>
  )
);
AdminUserIcon.displayName = 'AdminUserIcon';

const HRIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 124 124'
      xmlSpace='preserve'
      className={cn('fill-current', className)}
    >
      <path d='M121.4 89.5H2.6c-1.4 0-2.6 1.2-2.6 2.6v9.801c0 1.399 1.2 2.6 2.6 2.6h118.8c1.399 0 2.6-1.2 2.6-2.6V92.1c0-1.4-1.2-2.6-2.6-2.6M2.7 77.5h11.9c1.7 0 3.4-1.7 3.4-3.4V56.7c0-1.7 1-3.2 2.7-3.2h13.6c1.7 0 2.8 1.5 2.8 3.2v17.5c0 1.7 1.6 3.399 3.3 3.399h12c1.7 0 2.7-1.699 2.7-3.399V22c0-1.7-1-2.5-2.7-2.5h-12c-1.7 0-3.3.9-3.3 2.5v14.3c0 1.7-1.1 3.2-2.8 3.2H20.7C19 39.5 18 38 18 36.3V22c0-1.7-1.7-2.5-3.4-2.5H2.7C1 19.5 0 20.4 0 22v52.1c0 1.7 1 3.4 2.7 3.4m107.2-27.2c.899-.3 1.6-.7 2.3-1.1q3.6-2.25 5.7-5.7c1.399-2.3 2.1-5.1 2.1-8.3 0-3.7-.9-6.8-2.7-9.4s-4.2-4.1-7.1-5.1-7.2-1.2-12.7-1.2H69.1c-.899 0-2.1.2-2.1 1.1v55c0 .9 1.2 1.9 2.1 1.9H84c.9 0 2.1-1 2.1-1.9V55.1c0-.9.5-1.6 1.301-1.6 1.6 0 3 .4 4.3 1.3 1 .7 2 2.2 3.2 4.5l9.1 17.2c.3.5.8 1 1.4 1h16.8c1.2 0 2-1.4 1.399-2.5-2.6-5.1-4.899-10.5-8.199-15.3-1.301-1.9-2.7-4.1-4.4-5.6-1.101-.9-3.301-2.9-1.101-3.8M101 39.6c-.9 1.2-2.3 2-3.8 2.4-3.2.9-6.601.6-9.9.6-.9 0-1.3-.7-1.3-1.6v-8.7c0-.9.2-1.8 1.1-1.8h6.3c2.8 0 5.8.2 7.6 2.8 1.3 1.8 1.3 4.5 0 6.3' />
    </svg>
  )
);
HRIcon.displayName = 'HRIcon';

const UserKey = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path d='M12 1.2A4.8 4.8 0 1 0 16.8 6 4.805 4.805 0 0 0 12 1.2m0 8.6A3.8 3.8 0 1 1 15.8 6 3.804 3.804 0 0 1 12 9.8M9 22H4l.01-4.5A5.5 5.5 0 0 1 9.5 12h4.312a6 6 0 0 0-.462 1H9.5A4.505 4.505 0 0 0 5 17.5V21h4zm10-10.9a3.9 3.9 0 0 0-3.9 3.9 3.9 3.9 0 0 0 .225 1.255L11 20.727V23h2.993l.023-.01L15 22v-1h1.005L17 20v-1h1.004l.186-.187A3.9 3.9 0 1 0 19 11.1m0 6.9a3 3 0 0 1-1.223-.267l-.272.267H16v2h-2v1.674l-.408.326H12v-.906l4.419-4.591A2.97 2.97 0 0 1 16 15a3 3 0 1 1 3 3m.5-5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5m0 2a.5.5 0 1 1 .5-.5.5.5 0 0 1-.5.5' />
      <path fill='none' d='M0 0h24v24H0z' />
    </svg>
  )
);
UserKey.displayName = 'UserKey';

const PersonLeave = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 512 512'
      height='24'
      width='24'
      xmlSpace='preserve'
      className={cn('fill-current', className)}
    >
      <path d='M501.084 295.982h-17.462v-22.126c0-5.57-4.515-10.086-10.086-10.086h-5.964c.709-8.717-4.914-16.938-13.672-19.189l-57.62-14.81 18.561-48.611c5.374-14.076-1.673-29.852-15.761-35.231l-42.49-16.44c-8.143-3.151-16.891-3.956-25.479-2.38-33.716 6.185-89.129 16.352-95.531 17.522a18.3 18.3 0 0 0-10.802 6.327l-37.719 45.523V59.369a12.055 12.055 0 0 0-8.678-11.573l-81.14-23.68h210.377v89.025l24.112-3.15V12.06c0-6.658-5.398-12.056-12.056-12.056-1.709 0-306.832-.027-307.764.05C5.526.58.841 5.946.841 12.06c0 2.958-.057 440.79.104 442.075.613 4.872 4.095 8.755 8.575 10.064l162.107 47.309c7.723 2.257 15.433-3.561 15.433-11.573V250.25a18.2 18.2 0 0 0 7.416-5.339l54.243-65.467 60.479-11.061-40.764 106.762s1.453-3.672-25.712 89.318l-31.614 60.093v56.934h.001c9.305 2.27 19.27-1.977 23.908-10.795l46.438-88.273a21.4 21.4 0 0 0 1.597-3.948l25.689-87.938 5.789 2.21 44.751 70.286-32.169 90.604c-3.94 11.096 1.861 23.286 12.958 27.226 11.036 3.919 23.279-1.841 27.226-12.958l35.651-100.411a21.33 21.33 0 0 0-2.107-18.585l-31.286-49.137 13.584-35.578 28.807 7.405-.263 24.386H394.22c-2.269 0-4.355.759-6.039 2.022l26.713 41.955c6.327 9.937 7.695 22.004 3.754 33.106l-4.437 12.498h86.875c5.569 0 10.083-4.515 10.083-10.083v-69.414c0-5.571-4.515-10.086-10.085-10.086M152.698 316.97c0 6.658-5.398 12.056-12.056 12.056s-12.056-5.398-12.056-12.056v-69.596c0-6.658 5.398-12.056 12.056-12.056s12.056 5.398 12.056 12.056zm310.755-20.988h-31.599v-12.041h31.6z' />
      <path d='m315.805 325.767-8.188 28.028v86.777h-37.929l-12.685 24.113h52.405c-.579-5.552.081-11.207 2.005-16.624l20.318-57.222v-40.06zM416.914 50.634c-20.845-7.959-44.195 2.487-52.154 23.332-8.029 21.025 2.701 44.277 23.332 52.154 20.656 7.888 44.136-2.332 52.154-23.332 7.958-20.845-2.487-44.195-23.332-52.154' />
    </svg>
  )
);
PersonLeave.displayName = 'PersonLeave';

const OperationsIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 1024 1024'
      className={cn('fill-current', className)}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M389.44 768a96.064 96.064 0 0 1 181.12 0H896v64H570.56a96.064 96.064 0 0 1-181.12 0H128v-64zm192-288a96.064 96.064 0 0 1 181.12 0H896v64H762.56a96.064 96.064 0 0 1-181.12 0H128v-64zm-320-288a96.064 96.064 0 0 1 181.12 0H896v64H442.56a96.064 96.064 0 0 1-181.12 0H128v-64z' />
    </svg>
  )
);
OperationsIcon.displayName = 'OperationsIcon';

const UsersCheck = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='m16 18 2 2 4-4m-10-1H8c-1.864 0-2.796 0-3.53.305a4 4 0 0 0-2.166 2.164C2 18.204 2 19.136 2 21M15.5 3.29a4.001 4.001 0 0 1 0 7.42M13.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
        className={cn('stroke-current', className)}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
);
UsersCheck.displayName = 'UsersCheck';

const CycleIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 32 32'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='m12.953 28.484-1.584-10.589-3.182 4.301c-2.75-3.393-2.978-8.339-.26-12.013 2.577-3.483 7.02-4.769 10.926-3.499l-.548-3.665 4.493-.672C16.231-1.021 8.003.759 3.47 6.886c-4.545 6.144-3.823 14.56 1.356 19.852l-2.463 3.329zM26.941 5.445l2.58-3.487-10.589 1.583 1.584 10.589 3.056-4.131c2.633 3.388 2.814 8.239.137 11.858-2.534 3.426-6.875 4.726-10.732 3.559l.525 3.511-4.762.712c6.581 3.425 14.858 1.657 19.41-4.496 4.502-6.085 3.836-14.399-1.208-19.699z' />
    </svg>
  )
);
CycleIcon.displayName = 'CycleIcon';

const ClockStar = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 52 52'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path d='M38.71 25.59a11.3 11.3 0 0 1 11.29 11v.29a11.29 11.29 0 0 1-11 11.29h-.29a11.3 11.3 0 0 1-.3-22.59zm-.45 3.08v.1l-1.66 5.32a.4.4 0 0 1-.4.32h-5.43a.58.58 0 0 0-.39 1l.07.06 4.31 3.18a.55.55 0 0 1 .2.51v.09l-2 5.43a.53.53 0 0 0 .74.65h.07l4.67-3.45a.53.53 0 0 1 .55-.06l.08.06 4.63 3.45a.52.52 0 0 0 .83-.51v-.09l-2-5.43a.56.56 0 0 1 .11-.53l.07-.07L47 35.43a.57.57 0 0 0-.23-1h-5.44a.52.52 0 0 1-.45-.23v-.09l-1.67-5.31a.52.52 0 0 0-.95-.13M21.84 3a19.89 19.89 0 0 1 19.84 19.84v.24a14.3 14.3 0 0 0-2.47-.31h-.9v-.25a16.47 16.47 0 1 0-16.47 16.79 16.3 16.3 0 0 0 2.91-.26 14.2 14.2 0 0 0 .92 3.26 19.4 19.4 0 0 1-3.83.37 19.84 19.84 0 0 1 0-39.68M22 14.3a1.06 1.06 0 0 1 1 1V22a1.06 1.06 0 0 0 .27.76l3.81 3.93a1 1 0 0 1 0 1.45l-1.43 1.44a1 1 0 0 1-1.43 0l-5-5.1a1.4 1.4 0 0 1-.28-.76v-8.38a1.06 1.06 0 0 1 1-1H22z' />
    </svg>
  )
);
ClockStar.displayName = 'ClockStar';

const StatGraph = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 32 32'
      className={cn('fill-current', className)}
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect height='10' rx='1' ry='1' width='6' x='17' y='17' />
      <rect height='16' rx='1' ry='1' width='6' x='25' y='11' />
      <rect height='12' rx='1' ry='1' width='6' x='9' y='15' />
      <rect height='7' rx='1' ry='1' width='6' x='1' y='20' />
      <path d='M31 25H1v3a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3Z' />
      <path d='M4 17H2a1 1 0 0 1 0-2h1.52L10 6.94a1 1 0 1 1 1.56 1.24l-6.78 8.44A1 1 0 0 1 4 17m17.25-5.56a1 1 0 0 1-.62-.22 1 1 0 0 1-.16-1.4l6.75-8.44A1 1 0 0 1 28 1h2a1 1 0 0 1 0 2h-1.52L22 11.06a1 1 0 0 1-.75.38m-8.252-3.443 1.2-1.6 4.8 3.6-1.2 1.6z' />
      <circle cx='12' cy='6' r='3' />
      <circle cx='20' cy='11.99' r='3' />
    </svg>
  )
);
StatGraph.displayName = 'StatGraph';

const StepsIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      fill='currentColor'
      className={cn('fill-current', className)}
    >
      <path d='M.5 0a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-1 0V.5A.5.5 0 0 1 .5 0M2 1.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5z' />
    </svg>
  )
);
StepsIcon.displayName = 'StepsIcon';

const HeirarchyIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path d='M13.5 11h-1.729L8.438 6H9.5l.5-.5v-4L9.5 1h-4l-.5.5v4l.5.5h1.062l-3.333 5H1.5l-.5.5v3l.5.5h3l.5-.5v-3l-.5-.5h-.068L7.5 6.4l3.068 4.6H10.5l-.5.5v3l.5.5h3l.5-.5v-3zM6 5V2h3v3zm-2 7v2H2v-2zm9 2h-2v-2h2z' />
    </svg>
  )
);
HeirarchyIcon.displayName = 'HeirarchyIcon';

const VersionIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 21 21'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('stroke-current', className)}
    >
      <path
        d='m2.5 10.5 8 4 8.017-4M2.5 14.5l8 4 8.017-4M2.5 6.657l8.008 3.843 8.009-3.843L10.508 2.5z'
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
);
VersionIcon.displayName = 'VersionIcon';

const BrokenImage = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      className={cn('fill-current', className)}
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        d='M13 1a2 2 0 0 1 1.995 1.85L15 3v3.172l-2 2V3H3v10h5.172l-2 2H3a2 2 0 0 1-1.995-1.85L1 13V3a2 2 0 0 1 1.85-1.995L3 1zm2 8v4a2 2 0 0 1-1.85 1.995L13 15H9l2-2h2v-2zM9.5 8l1.713 1.958L9.173 12H4v-1.2L5.5 9l1.524 1.83zm-3-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3'
      />
    </svg>
  )
);
BrokenImage.displayName = 'BrokenImage';

const UserEditIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      className={cn('stroke-current', className)}
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9 15.5H7.5c-1.396 0-2.093 0-2.661.172a4 4 0 0 0-2.667 2.667C2 18.907 2 19.604 2 21M14.5 7.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0M11 21l3.101-.886c.149-.043.223-.064.292-.096a1 1 0 0 0 .175-.102c.061-.045.116-.1.225-.21l6.457-6.456a1.768 1.768 0 1 0-2.5-2.5l-6.457 6.457a2 2 0 0 0-.209.225 1 1 0 0 0-.102.175 2 2 0 0 0-.096.292z'
        stroke-width='2'
        stroke-linecap='round'
        stroke-linejoin='round'
      />
    </svg>
  )
);
UserEditIcon.displayName = 'UserEditIcon';

const RecoverIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 48 48'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <g data-name='Layer 2'>
        <path fill='none' data-name='invisible box' d='M0 0h48v48H0z' />
        <path d='M24 2A21.8 21.8 0 0 0 8 8.9V7a2 2 0 0 0-2.3-2A2.1 2.1 0 0 0 4 7.1V14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2.3 2.1 2.1 0 0 0-2.1-1.7h-2.3a18 18 0 0 1 31.3 10.2 2 2 0 0 0 2 1.8 2 2 0 0 0 2-2.2A22 22 0 0 0 24 2m18 30h-7a2 2 0 0 0-2 2.3 2.1 2.1 0 0 0 2.1 1.7h2.3A18 18 0 0 1 6.1 25.8a2 2 0 0 0-2-1.8 2 2 0 0 0-2 2.2A22 22 0 0 0 40 39.1V41a2 2 0 0 0 2.3 2 2.1 2.1 0 0 0 1.7-2.1V34a2 2 0 0 0-2-2' />
        <path d='M18.1 33a37.6 37.6 0 0 0 5.4 3.8l.5.2.5-.2c1.9-1.1 9.5-5.5 9.5-10.5v-8.9l-10-4.2-10 4.2v8.9c0 2.5 1.9 4.8 4 6.6h.1ZM24 17.5l6 2.6v6.2c0 .2-.2 2.4-6 6.1Z' />
      </g>
    </svg>
  )
);
RecoverIcon.displayName = 'RecoverIcon';

const ProfileIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 36 36'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path d='m33.53 18.76-6.93-3.19V6.43a1 1 0 0 0-.6-.9l-7.5-3.45a1 1 0 0 0-.84 0l-7.5 3.45a1 1 0 0 0-.58.91v9.14l-6.9 3.18a1 1 0 0 0-.58.91v9.78a1 1 0 0 0 .58.91l7.5 3.45a1 1 0 0 0 .84 0l7.08-3.26 7.08 3.26a1 1 0 0 0 .84 0l7.5-3.45a1 1 0 0 0 .58-.91v-9.78a1 1 0 0 0-.57-.91M25.61 22l-5.11-2.33 5.11-2.35 5.11 2.35Zm-1-6.44-6.44 3v-7.69a1 1 0 0 0 .35-.08L24.6 8v7.58ZM18.1 4.08l5.11 2.35-5.11 2.35L13 6.43Zm-7.5 13.23 5.11 2.35L10.6 22l-5.11-2.33Zm6.5 11.49-6.5 3v-7.69A1 1 0 0 0 11 24l6.08-2.8Zm15 0-6.46 3v-7.69A1 1 0 0 0 26 24l6.08-2.8Z' />
      <path fill='none' d='M0 0h36v36H0z' />
    </svg>
  )
);
ProfileIcon.displayName = 'ProfileIcon';

const FacebookRounded = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      x='0px'
      y='0px'
      width='24'
      height='24'
      viewBox='0 0 48 48'
      className={cn('fill-current', className)}
    >
      <path fill='#039be5' d='M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z'></path>
      <path
        fill='#fff'
        d='M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z'
      ></path>
    </svg>
  )
);
FacebookRounded.displayName = 'FacebookRounded';

const LinkedIn = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 50 50'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('fill-current', className)}
    >
      <path d='M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z M11,14.47c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10 c0-2-1-4-3.5-4.04h-0.08C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,5.81-2.56 c3.97,0,7.19,2.73,7.19,8.26V39z'></path>
    </svg>
  )
);
LinkedIn.displayName = 'LinkedIn';

const SiteSparkle = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      className={className}
    >
      <defs>
        <linearGradient id='fillGradient'>
          <stop offset='0%' stopColor='#bd1cc2'></stop>
          <stop offset='100%' stopColor='#f5561c'></stop>
        </linearGradient>
      </defs>
      <path
        fill='url(#fillGradient)'
        d='M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'
      />
    </svg>
  )
);
SiteSparkle.displayName = 'SiteSparkle';

const TwitterXIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 50 50'
      className={cn('fill-current', className)}
    >
      <path d='M11 4a7 7 0 0 0-7 7v28a7 7 0 0 0 7 7h28a7 7 0 0 0 7-7V11a7 7 0 0 0-7-7zm2.086 9h7.937l5.637 8.01L33.5 13H36l-8.21 9.613L37.913 37H29.98l-6.541-9.293L15.5 37H13l9.309-10.896zm3.828 2 14.107 20h3.065L19.979 15z' />
    </svg>
  )
);
TwitterXIcon.displayName = 'TwitterXIcon';

const GoogleIcon = React.forwardRef<SVGElement, SVGAttributes>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      x='0px'
      y='0px'
      width='24'
      height='24'
      viewBox='0 0 48 48'
      className={cn('fill-current', className)}
    >
      <path
        fill='#FFC107'
        d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
      <path
        fill='#FF3D00'
        d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
      ></path>
      <path
        fill='#4CAF50'
        d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
      ></path>
      <path
        fill='#1976D2'
        d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
    </svg>
  )
);
GoogleIcon.displayName = 'GoogleIcon';

const Icons = {
  google: GoogleIcon,
  x: TwitterXIcon,
  siteSparkle: SiteSparkle,
  instagram: InstagramIcon,
  profile: ProfileIcon,
  imageDownload: ImageDown,
  recover: RecoverIcon,
  save: Save,
  userEdit: UserEditIcon,
  copy: Copy,
  brokenImage: BrokenImage,
  externalLink: ExternalLink,
  reset: RotateCcw,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  boxChecked: SquareCheck,
  boxCrossed: SquareX,
  version: VersionIcon,
  factory: Factory,
  heirarchy: HeirarchyIcon,
  steps: StepsIcon,
  fileCog: FileCog,
  userX: UserX,
  statGraph: StatGraph,
  clockStar: ClockStar,
  cycle: CycleIcon,
  usersCheck: UsersCheck,
  operations: OperationsIcon,
  leave: PersonLeave,
  userKey: UserKey,
  hr: HRIcon,
  userPlus: UserPlus,
  adminUser: AdminUserIcon,
  userCheck: UserCheck,
  pay: HandCoins,
  landmark: Landmark,
  calendarMoney: CalendarMoney,
  employeeSalary: EmployeeSalary,
  idCard: IdCardIcon,
  department: DepartmentIcon,
  calendarAlert: CalendarAlert,
  userRole: UserRole,
  lawBuilding: LawBuilding,
  distribution: DistributionIcon,
  category: CategoryIcon,
  calendarClock: LucideCalendarClock,
  calendarDays: CalendarDaysIcon,
  late: RunningLateIcon,
  clock: Clock,
  siteIcon: SiteIcon,
  presentation: Presentation,
  briefcase: Briefcase,
  star: Star,
  dot: Dot,
  user2: User2,
  update: RefreshCcw,
  word: WordIcon,
  filter: Filter,
  chevronsUpDown: ChevronsUpDown,
  employees: Users2,
  arrowUpDown: ArrowUpDown,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  excel: ExcelIcon,
  pdf: PDFIcon,
  employee: User2,
  printer: Printer,
  contact: Contact,
  handshake: Handshake,
  fileX: FileX,
  scale: Scale,
  company: Building2,
  bell: Bell,
  play: Play,
  list: List,
  chart: ChartArea,
  money: CircleDollarSign,
  userCog: UserCog,
  receipt: Receipt,
  userSearch: UserSearch,
  todo: ListTodo,
  images: Images,
  files: Files,
  building: Building,
  home: Home,
  download: Download,
  telescope: Telescope,
  fileUp: FileUp,
  imageUp: ImageUp,
  code: Code,
  github: GitHubIcon,
  cloud: Cloud,
  users: Users,
  invite: UserPlus,
  more: MoreHorizontal,
  analytics: AnalyticsIcon,
  gender: GenderIcon,
  male: () => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={24}
      height={24}
      viewBox='0 0 448 512'
      fill='currentColor'
    >
      <path d='M289.8 46.8c3.7-9 12.5-14.8 22.2-14.8l112 0c13.3 0 24 10.7 24 24l0 112c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-33.4-33.4L321 204.2c19.5 28.4 31 62.7 31 99.8c0 97.2-78.8 176-176 176S0 401.2 0 304s78.8-176 176-176c37 0 71.4 11.4 99.8 31l52.6-52.6L295 73c-6.9-6.9-8.9-17.2-5.2-26.2zM400 80s0 0 0 0s0 0 0 0s0 0 0 0zM176 416a112 112 0 1 0 0-224 112 112 0 1 0 0 224z' />
    </svg>
  ),
  female: () => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={24}
      height={24}
      viewBox='0 0 384 512'
      fill='currentColor'
    >
      <path d='M80 176a112 112 0 1 1 224 0A112 112 0 1 1 80 176zM224 349.1c81.9-15 144-86.8 144-173.1C368 78.8 289.2 0 192 0S16 78.8 16 176c0 86.3 62.1 158.1 144 173.1l0 34.9-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-34.9z' />
    </svg>
  ),
  cake: Cake,
  like: ThumbsUp,
  dislike: ThumbsDown,
  resend: RotateCw,
  error: CircleX,
  key: Key,
  terms: Handshake,
  inbox: Inbox,
  help2: LifeBuoy,
  headset: Headset,
  cog: Cog,
  bug: Bug,
  rabbit: Rabbit,
  squirrel: Squirrel,
  warn: AlertTriangle,
  sun: SunMedium,
  moon: Moon,
  image: Image,
  file: File,
  help: HelpCircle,
  hospital: Hospital,
  link: Link,
  video: Video,
  videoOff: VideoOff,
  micOff: MicOff,
  message: MessageSquare,
  messageOff: MessageSquareOff,
  mic: Mic,
  maximize: Maximize,
  minimize: Minimize,
  phoneOff: PhoneOff,
  document: FileText,
  menu: Menu,
  search: Search,
  chat: MessagesSquare,
  info: InfoIcon,
  send: Send,
  spinner: LoaderCircle,
  settings: Settings,
  sparkles: Sparkles,
  sparkle: Sparkle,
  flame: Flame,
  logout: LogOut,
  truck: Truck,
  camera: Camera,
  history: History,
  coin: HandCoins,
  trash: Trash,
  store: Store,
  pencil: Pencil,
  attachments: Paperclip,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  bag: ShoppingBag,
  cart: ShoppingCart,
  check: Check,
  menuDots: EllipsisVertical,
  mapPin: MapPin,
  note: NotebookPen,
  ticket: Ticket,
  discount: TicketPercent,
  bill: Receipt,
  minus: MinusCircle,
  plus: PlusCircle,
  login: LogIn,
  cross: XIcon,
  visible: EyeIcon,
  hidden: EyeOffIcon,
  user: CircleUserRound,
  phone: Phone,
  upload: Upload,
  edit: Edit,
  pin: Pin,
  mail: Mail,
  hourglass: Hourglass,
  packageCheck: PackageCheck,
  packageX: PackageX,
  folderCog: FolderCog,
  badgeCheck: BadgeCheck,
  uploadCloud: UploadCloud,
  close: XCircle,
  calendar: Calendar,
  fb: FacebookRounded,
  linkedin: LinkedIn,
  twitter: () => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-twitter'
    >
      <path d='M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' />
    </svg>
  ),
  youtube: YouTubeIcon,
  prescription: () => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 28 34'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='dark:invert'
    >
      <path
        d='M10.8353 14.5306C10.9063 14.5311 10.9767 14.5174 11.0422 14.4901C11.1078 14.4629 11.1672 14.4228 11.2169 14.3722C11.2674 14.3223 11.3075 14.2628 11.3349 14.1973C11.3623 14.1318 11.3764 14.0616 11.3764 13.9906C11.3764 13.9196 11.3623 13.8493 11.3349 13.7838C11.3075 13.7183 11.2674 13.6589 11.2169 13.609L9.08933 11.4814L11.2169 9.35016C11.27 9.30072 11.3125 9.24111 11.342 9.17487C11.3716 9.10863 11.3874 9.03712 11.3887 8.96462C11.39 8.89211 11.3767 8.82009 11.3495 8.75285C11.3223 8.68561 11.2819 8.62453 11.2306 8.57325C11.1794 8.52198 11.1183 8.48155 11.051 8.45439C10.9838 8.42723 10.9118 8.4139 10.8393 8.41518C10.7668 8.41645 10.6953 8.43232 10.629 8.46184C10.5628 8.49135 10.5032 8.53391 10.4537 8.58696L8.32613 10.7182L6.12293 8.51496H6.63053C7.21235 8.459 7.75245 8.18829 8.14547 7.75565C8.5385 7.32301 8.75625 6.75947 8.75625 6.17496C8.75625 5.59046 8.5385 5.02691 8.14547 4.59427C7.75245 4.16163 7.21235 3.89092 6.63053 3.83496H4.83053C4.68731 3.83496 4.54996 3.89185 4.44869 3.99312C4.34742 4.09439 4.29053 4.23174 4.29053 4.37496V11.6002C4.29053 11.7434 4.34742 11.8807 4.44869 11.982C4.54996 12.0833 4.68731 12.1402 4.83053 12.1402C4.97374 12.1402 5.1111 12.0833 5.21236 11.982C5.31363 11.8807 5.37053 11.7434 5.37053 11.6002V9.27816L7.57013 11.4814L5.63333 13.4002C5.58282 13.4501 5.54272 13.5095 5.51536 13.575C5.48799 13.6405 5.4739 13.7108 5.4739 13.7818C5.4739 13.8528 5.48799 13.923 5.51536 13.9885C5.54272 14.054 5.58282 14.1135 5.63333 14.1634C5.68281 14.2143 5.74217 14.2547 5.80779 14.2819C5.8734 14.3092 5.94389 14.3227 6.01493 14.3218C6.08591 14.3223 6.15627 14.3086 6.22182 14.2813C6.28738 14.2541 6.34679 14.214 6.39653 14.1634L8.32613 12.2374L10.4537 14.365C10.5028 14.4169 10.562 14.4584 10.6276 14.4868C10.6932 14.5153 10.7638 14.5302 10.8353 14.5306ZM5.35973 4.89696H6.63053C6.9554 4.91427 7.26126 5.05552 7.4851 5.2916C7.70894 5.52769 7.83371 5.84063 7.83371 6.16596C7.83371 6.49129 7.70894 6.80424 7.4851 7.04032C7.26126 7.27641 6.9554 7.41765 6.63053 7.43496H5.35973V4.89696Z'
        fill='black'
      />
      <path
        d='M24.9727 15.92V15.47H25.0843C25.2275 15.47 25.3649 15.4132 25.4661 15.3119C25.5674 15.2106 25.6243 15.0733 25.6243 14.93V12.4604C25.6243 12.3172 25.5674 12.1799 25.4661 12.0786C25.3649 11.9773 25.2275 11.9204 25.0843 11.9204H22.2799V6.70765C22.2834 6.67294 22.2834 6.63796 22.2799 6.60325C22.2713 6.55668 22.2555 6.51173 22.2331 6.47005V6.44125C22.2096 6.39914 22.1805 6.36039 22.1467 6.32605L16.2355 0.440048C16.203 0.40508 16.1638 0.376934 16.1203 0.357248L16.0915 0.339248C16.0508 0.317339 16.0072 0.301568 15.9619 0.292448C15.9272 0.28891 15.8922 0.28891 15.8575 0.292448H1.27389C1.13611 0.2922 1.00345 0.344624 0.903063 0.438988C0.802675 0.533353 0.742153 0.66252 0.733887 0.800048V27.17C0.733887 27.3133 0.79078 27.4506 0.892049 27.5519C0.993319 27.6532 1.13067 27.71 1.27389 27.71H9.31989V33.2C9.31989 33.3433 9.37678 33.4806 9.47805 33.5819C9.57932 33.6832 9.71667 33.74 9.85989 33.74H17.5099C17.6531 33.74 17.7905 33.6832 17.8917 33.5819C17.993 33.4806 18.0499 33.3433 18.0499 33.2V31.436H26.7259C26.8688 31.4351 27.0056 31.3779 27.1067 31.2768C27.2077 31.1758 27.2649 31.039 27.2659 30.896V19.0772C27.2655 18.3764 27.0434 17.6936 26.6315 17.1266C26.2197 16.5595 25.639 16.1372 24.9727 15.92ZM9.49269 21.1904V18.9476H17.8663V21.194L9.49269 21.1904ZM16.2931 22.2704H16.9627V23.4944H10.3999V22.2704H16.2931ZM18.0427 26.4068V22.274H18.4027C18.5456 22.2731 18.6824 22.2159 18.7835 22.1148C18.8845 22.0138 18.9417 21.877 18.9427 21.734V20.654H26.1859V26.414L18.0427 26.4068ZM26.1787 19.5668H18.9463V18.4076C18.9463 18.2644 18.8894 18.1271 18.7881 18.0258C18.6869 17.9245 18.5495 17.8676 18.4063 17.8676H17.7403C17.9419 17.5531 18.2193 17.2943 18.547 17.115C18.8748 16.9358 19.2423 16.8417 19.6159 16.8416H23.9359C24.5285 16.8426 25.0966 17.0784 25.5156 17.4975C25.9347 17.9165 26.1705 18.4846 26.1715 19.0772L26.1787 19.5668ZM23.8927 15.7616H19.6735V15.47H23.8927V15.7616ZM24.5443 14.39H19.0399V13.0004H24.5443V14.39ZM10.3999 24.578H16.9699V30.338H10.3999V24.578ZM16.9699 32.6493H10.3999V31.4252H16.9699V32.6493ZM26.1859 30.3452H18.0499V27.4904H26.1859V30.3452ZM20.4475 6.16765H16.3939V2.11405L20.4475 6.16765ZM1.81389 26.63V1.35085H15.3139V6.70765C15.3139 6.85086 15.3708 6.98822 15.472 7.08949C15.5733 7.19075 15.7107 7.24765 15.8539 7.24765H21.1999V11.9276H18.4819C18.3387 11.9276 18.2013 11.9845 18.1 12.0858C17.9988 12.1871 17.9419 12.3244 17.9419 12.4676V14.9372C17.9419 15.0805 17.9988 15.2178 18.1 15.3191C18.2013 15.4204 18.3387 15.4772 18.4819 15.4772H18.5935V15.92C18.1256 16.0716 17.697 16.3248 17.3385 16.6615C16.98 16.9983 16.7004 17.4101 16.5199 17.8676H8.95989C8.81667 17.8676 8.67932 17.9245 8.57805 18.0258C8.47678 18.1271 8.41989 18.2644 8.41989 18.4076V21.734C8.41989 21.8773 8.47678 22.0146 8.57805 22.1159C8.67932 22.2172 8.81667 22.274 8.95989 22.274H9.31989V26.63H1.81389Z'
        fill='black'
      />
      <path
        d='M23.0645 22.9869H22.3229V22.2669C22.3212 22.2068 22.3103 22.1473 22.2905 22.0905C22.2543 21.9849 22.1858 21.8933 22.0947 21.8287C22.0037 21.7641 21.8946 21.7297 21.7829 21.7305C21.6397 21.7305 21.5024 21.7874 21.4011 21.8886C21.2998 21.9899 21.2429 22.1273 21.2429 22.2705V22.9905H20.5013C20.3581 22.9905 20.2208 23.0474 20.1195 23.1486C20.0182 23.2499 19.9613 23.3873 19.9613 23.5305C19.9613 23.6737 20.0182 23.811 20.1195 23.9123C20.2208 24.0136 20.3581 24.0705 20.5013 24.0705H21.2429V24.8121C21.2447 24.9384 21.2908 25.0601 21.373 25.156C21.4553 25.2519 21.5686 25.3159 21.6932 25.3369C21.8178 25.3579 21.9458 25.3345 22.055 25.2708C22.1641 25.2072 22.2475 25.1073 22.2905 24.9885C22.3103 24.9317 22.3212 24.8722 22.3229 24.8121V24.0669H23.0645C23.2077 24.0669 23.3451 24.01 23.4464 23.9087C23.5476 23.8074 23.6045 23.6701 23.6045 23.5269C23.6045 23.3837 23.5476 23.2463 23.4464 23.145C23.3451 23.0438 23.2077 22.9869 23.0645 22.9869ZM12.4013 28.0017H13.1429V28.7217C13.1429 28.8649 13.1998 29.0022 13.3011 29.1035C13.4024 29.2048 13.5397 29.2617 13.6829 29.2617C13.8261 29.2617 13.9635 29.2048 14.0648 29.1035C14.166 29.0022 14.2229 28.8649 14.2229 28.7217V28.0017H14.9609C15.0599 28.0024 15.1572 27.9755 15.2418 27.9239C15.3264 27.8724 15.3949 27.7984 15.4397 27.7101C15.4834 27.6347 15.5058 27.5488 15.5045 27.4617C15.5045 27.3185 15.4476 27.1811 15.3464 27.0798C15.2451 26.9786 15.1077 26.9217 14.9645 26.9217H14.2229V26.1801C14.2229 26.0369 14.166 25.8995 14.0648 25.7982C13.9635 25.697 13.8261 25.6401 13.6829 25.6401C13.5397 25.6401 13.4024 25.697 13.3011 25.7982C13.1998 25.8995 13.1429 26.0369 13.1429 26.1801V26.9217H12.4013C12.2581 26.9217 12.1208 26.9786 12.0195 27.0798C11.9182 27.1811 11.8613 27.3185 11.8613 27.4617C11.8619 27.5486 11.8842 27.634 11.9261 27.7101C11.971 27.7976 12.0391 27.871 12.1229 27.9225C12.2067 27.9739 12.303 28.0013 12.4013 28.0017Z'
        fill='black'
      />
    </svg>
  )
};

export { YouTubeIcon };

export default Icons;

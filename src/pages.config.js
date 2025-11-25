import Dashboard from './pages/Dashboard';
import Wellness from './pages/Wellness';
import Journal from './pages/Journal';
import Goals from './pages/Goals';
import TikTokGoals from './pages/TikTokGoals';
import Home from './pages/Home';
import Settings from './pages/Settings';
import TikTokEngagement from './pages/TikTokEngagement';
import LiveSchedule from './pages/LiveSchedule';
import DiscoverCreators from './pages/DiscoverCreators';
import Supplements from './pages/Supplements';
import Medications from './pages/Medications';
import GifterManager from './pages/GifterManager';
import GiftLibrary from './pages/GiftLibrary';
import GiftEntry from './pages/GiftEntry';
import WeeklySummary from './pages/WeeklySummary';
import LiveReminders from './pages/LiveReminders';
import TikTokContacts from './pages/TikTokContacts';
import PetCare from './pages/PetCare';
import CareReminders from './pages/CareReminders';
import People from './pages/People';
import GoalSharing from './pages/GoalSharing';
import NeurodivergentSettings from './pages/NeurodivergentSettings';
import GiftScreenshotImport from './pages/GiftScreenshotImport';
import SongGenerator from './pages/SongGenerator';
import TikTokDashboard from './pages/TikTokDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Wellness": Wellness,
    "Journal": Journal,
    "Goals": Goals,
    "TikTokGoals": TikTokGoals,
    "Home": Home,
    "Settings": Settings,
    "TikTokEngagement": TikTokEngagement,
    "LiveSchedule": LiveSchedule,
    "DiscoverCreators": DiscoverCreators,
    "Supplements": Supplements,
    "Medications": Medications,
    "GifterManager": GifterManager,
    "GiftLibrary": GiftLibrary,
    "GiftEntry": GiftEntry,
    "WeeklySummary": WeeklySummary,
    "LiveReminders": LiveReminders,
    "TikTokContacts": TikTokContacts,
    "PetCare": PetCare,
    "CareReminders": CareReminders,
    "People": People,
    "GoalSharing": GoalSharing,
    "NeurodivergentSettings": NeurodivergentSettings,
    "GiftScreenshotImport": GiftScreenshotImport,
    "SongGenerator": SongGenerator,
    "TikTokDashboard": TikTokDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
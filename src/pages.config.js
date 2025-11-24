import Onboarding from './pages/Onboarding';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
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
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};
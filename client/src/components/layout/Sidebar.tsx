import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import ShoppingCart from "@/components/cart/ShoppingCart";
import PostProductModal from "@/components/product/PostProductModal";
import { 
  FaHome, 
  FaCompass, 
  FaStore, 
  FaComments, 
  FaUser, 
  FaShoppingCart, 
  FaPlus, 
  FaTimes,
  FaBars 
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/ELDADY-LOGO.png";

const navigationItems = [
  { path: "/", icon: FaHome, label: "Home", testId: "nav-home" },
  { path: "/explore", icon: FaCompass, label: "Explore", testId: "nav-explore" },
  { path: "/vroom", icon: FaStore, label: "My Vroom", testId: "nav-vroom" },
  { path: "/messages", icon: FaComments, label: "Messages", testId: "nav-messages" },
  { path: "/profile", icon: FaUser, label: "Profile", testId: "nav-profile" },
];

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, isOpen = false, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();

  // fetch user vrooms
  const { data: userVrooms } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: !!user,
    select: (data) => Array.isArray(data) ? data : [],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleMyVroomClick = () => {
    if (userVrooms && userVrooms.length > 0) {
      setLocation(`/vroom/${userVrooms[0].id}`);
      if (isMobile && onClose) onClose();
    } else {
      setLocation("/vroom");
      if (isMobile && onClose) onClose();
    }
  };

  const handleNavigationClick = (path: string) => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleCartClick = () => {
    setShowCart(true);
    if (isMobile && onClose) onClose();
  };

  const handlePostProductClick = () => {
    setShowPostModal(true);
    if (isMobile && onClose) onClose();
  };

  // Main sidebar content
  const sidebarContent = (
    <div className={`
      bg-card border-r border-border overflow-y-auto
      ${isMobile 
        ? "w-full h-full p-6" 
        : "w-64 fixed h-full p-6"
      }
    `} 
    data-testid="sidebar"
    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <div className="space-y-6">
        {/* Header with Close Button for Mobile */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <img 
              src={logo} 
              alt="Eldady Logo" 
              className="w-20 h-auto object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <FaTimes size={16} />
            </Button>
          </div>
        )}

        {/* Logo for Desktop */}
        {!isMobile && (
          <img 
            src={logo} 
            alt="Eldady Logo" 
            className="w-24 h-auto object-contain"
          />
        )}

        {/* Navigation */}
        <nav className="space-y-2" data-testid="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.path ||
              (item.path === "/vroom" && location.startsWith("/vroom"));

            if (item.path === "/vroom") {
              return (
                <div
                  key={item.path}
                  onClick={handleMyVroomClick}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <div
                  onClick={() => handleNavigationClick(item.path)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Cart Button */}
        <Button
          onClick={handleCartClick}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center space-x-2"
          data-testid="button-cart"
          size={isMobile ? "default" : "default"}
        >
          <FaShoppingCart />
          <span>Cart</span>
          {cartItemCount > 0 && (
            <Badge variant="secondary" className="bg-accent-foreground text-accent" data-testid="cart-item-count">
              {cartItemCount}
            </Badge>
          )}
        </Button>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handlePostProductClick}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-post-product"
            size={isMobile ? "default" : "default"}
          >
            <FaPlus className="mr-2" />
            Post Product
          </Button>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
          data-testid="button-logout"
          size={isMobile ? "default" : "default"}
        >
          Logout
        </Button>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-40 lg:hidden">
      <div className="flex justify-around items-center">
        {navigationItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.path ||
            (item.path === "/vroom" && location.startsWith("/vroom"));

          if (item.path === "/vroom") {
            return (
              <button
                key={item.path}
                onClick={handleMyVroomClick}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-${item.testId}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate max-w-full">{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-${item.testId}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate max-w-full">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Cart Icon in Bottom Nav */}
        <button
          onClick={handleCartClick}
          className="flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 text-muted-foreground relative"
          data-testid="mobile-button-cart"
        >
          <FaShoppingCart className="w-5 h-5 mb-1" />
          <span className="text-xs">Cart</span>
          {cartItemCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent-foreground text-accent"
            >
              {cartItemCount}
            </Badge>
          )}
        </button>

        {/* More Menu Trigger */}
        <button
          onClick={onClose}
          className="flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 text-muted-foreground"
          data-testid="mobile-menu-trigger"
        >
          <FaBars className="w-5 h-5 mb-1" />
          <span className="text-xs">More</span>
        </button>
      </div>
    </div>
  );

  // Mobile Floating Action Button
  const MobileFAB = () => (
    <button
      onClick={handlePostProductClick}
      className="fixed bottom-20 right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition z-30 lg:hidden"
      data-testid="mobile-fab-post"
    >
      <FaPlus size={20} />
    </button>
  );

  // Return based on mobile/desktop
  if (isMobile) {
    return (
      <>
        {/* Mobile Sidebar Overlay */}
        <div className={`
          fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `} onClick={onClose} />
        
        {/* Mobile Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full w-4/5 max-w-sm bg-card z-50 transform transition-transform duration-300 lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {sidebarContent}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* Mobile Floating Action Button */}
        <MobileFAB />

        {/* Shopping Cart */}
        <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />

        {/* Post Product Modal */}
        <PostProductModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
      </>
    );
  }

  // Desktop version
  return (
    <>
      {sidebarContent}
      
      {/* Shopping Cart */}
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />

      {/* Post Product Modal */}
      <PostProductModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
    </>
  );
}

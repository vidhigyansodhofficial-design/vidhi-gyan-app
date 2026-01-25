// app/screens/account.tsx

import FooterNav from '@/components/FooterNav';
import Header from '@/components/Header';
import SafeScreen from '@/components/SafeScreen';
import { Palette } from '@/constants/theme';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// 🔹 Bootstrap SVG Icons
const EditIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
        <Path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
    </Svg>
);

const PaymentIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1z" />
    </Svg>
);

const DownloadIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
        <Path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
    </Svg>
);

const SettingsIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path d="M7.068.727c.243-.97 1.62-.97 1.864 0l.071.286a.96.96 0 0 0 1.622.434l.205-.211c.695-.719 1.888-.03 1.613.931l-.08.284a.96.96 0 0 0 1.187 1.187l.283-.081c.96-.275 1.65.918.931 1.613l-.211.205a.96.96 0 0 0 .434 1.622l.286.071c.97.243.97 1.62 0 1.864l-.286.071a.96.96 0 0 0-.434 1.622l.211.205c.719.695.03 1.888-.931 1.613l-.284-.08a.96.96 0 0 0-1.187 1.187l.081.283c.275.96-.918 1.65-1.613.931l-.205-.211a.96.96 0 0 0-1.622.434l-.071.286c-.243.97-1.62.97-1.864 0l-.071-.286a.96.96 0 0 0-1.622-.434l-.205.211c-.695.719-1.888.03-1.613-.931l.08-.284a.96.96 0 0 0-1.186-1.187l-.284.081c-.96.275-1.65-.918-.931-1.613l.211-.205a.96.96 0 0 0-.434-1.622l-.286-.071c-.97-.243-.97-1.62 0-1.864l.286-.071a.96.96 0 0 0 .434-1.622l-.211-.205c-.719-.695-.03-1.888.931-1.613l.284.08a.96.96 0 0 0 1.187-1.186l-.081-.284c-.275-.96.918-1.65 1.613-.931l.205.211a.96.96 0 0 0 1.622.434zM12.973 8.5H8.25l-2.834 3.779A4.998 4.998 0 0 0 12.973 8.5m0-1a4.998 4.998 0 0 0-7.557-3.779l2.834 3.78zM5.048 3.967l-.087.065zm-.431.355A4.98 4.98 0 0 0 3.002 8c0 1.455.622 2.765 1.615 3.678L7.375 8zm.344 7.646.087.065z" />
    </Svg>
);

const HelpIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path d="M8.05 9.6c.336 0 .504-.24.554-.627.04-.534.198-.815.847-1.26.673-.475 1.049-1.09 1.049-1.986 0-1.325-.92-2.227-2.262-2.227-1.02 0-1.792.492-2.1 1.29A1.7 1.7 0 0 0 6 5.48c0 .393.203.64.545.64.272 0 .455-.147.564-.51.158-.592.525-.915 1.074-.915.61 0 1.03.446 1.03 1.084 0 .563-.208.885-.822 1.325-.619.433-.926.914-.926 1.64v.111c0 .428.208.745.585.745" />
        <Path d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.637-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z" />
        <Path d="M7.001 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0" />
    </Svg>
);

const LogoutIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="currentColor">
        <Path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
        <Path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
    </Svg>
);

// 🔹 Account Card
const AccountCard = ({
    title,
    subtitle,
    icon,
    onPress,
    isLogout = false,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onPress: () => void;
    isLogout?: boolean;
}) => (
    <TouchableOpacity
        style={[styles.card, isLogout && styles.logoutCard]}
        onPress={onPress}
    >
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.textContainer}>
            <Text style={[styles.cardTitle, isLogout && styles.logoutTitle]}>{title}</Text>
            <Text style={[styles.cardSubtitle, isLogout && styles.logoutSubtitle]}>{subtitle}</Text>
        </View>
        <View style={styles.arrowContainer}>
            <Text style={[styles.arrow, isLogout && styles.logoutArrow]}>›</Text>
        </View>
    </TouchableOpacity>
);

export default function AccountScreen() {
    const router = useRouter();

    const user = {
        name: 'Arjun Kumar',
        email: 'arjun.kumar@email.com',
        courses: 12,
        completed: 8,
        learningTime: '45h',
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => router.push('/screens/login'),
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeScreen>
                <Header title="Account" subtitle="Manage your profile and settings" />

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* User Profile */}
                    <View style={styles.profileContainer}>
                        <Image
                            source={{
                                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.1.0&ixid=M3wzNzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zb2xlJTIwdXNlcnxlbnwwfHx8fDE3NjAwMzY5ODF8MA&auto=format&fit=crop&w=1080',
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <TouchableOpacity style={styles.editProfileButton}>
                            <EditIcon />
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{user.courses}</Text>
                            <Text style={styles.statLabel}>Courses</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{user.completed}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, styles.statHighlight]}>{user.learningTime}</Text>
                            <Text style={styles.statLabel}>Learning Time</Text>
                        </View>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.actionCards}>
                        <AccountCard
                            title="Edit Profile"
                            subtitle="Update your personal information"
                            icon={<EditIcon />}
                            onPress={() => Alert.alert('Edit Profile', 'Feature coming soon')}
                        />
                        <AccountCard
                            title="Payment History"
                            subtitle="View your transaction history"
                            icon={<PaymentIcon />}
                            onPress={() => Alert.alert('Payment History', 'Feature coming soon')}
                        />
                        <AccountCard
                            title="Downloads"
                            subtitle="Access your downloaded materials"
                            icon={<DownloadIcon />}
                            onPress={() => Alert.alert('Downloads', 'Feature coming soon')}
                        />
                        <AccountCard
                            title="Settings"
                            subtitle="App preferences and notifications"
                            icon={<SettingsIcon />}
                            onPress={() => Alert.alert('Settings', 'Feature coming soon')}
                        />
                        <AccountCard
                            title="Help Center"
                            subtitle="FAQs and customer support"
                            icon={<HelpIcon />}
                            onPress={() => Alert.alert('Help Center', 'Feature coming soon')}
                        />
                        <AccountCard
                            title="Logout"
                            subtitle="Sign out of your account"
                            icon={<LogoutIcon />}
                            onPress={handleLogout}
                            isLogout
                        />
                    </View>

                    {/* Version */}
                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>Vidhi Gyan Sodh</Text>
                        <Text style={styles.versionText}>Version 1.0</Text>
                    </View>
                </ScrollView>

                {/* Fixed Footer */}
                <FooterNav />
            </SafeScreen>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.white,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Palette.white,
        borderBottomWidth: 1,
        borderBottomColor: Palette.divider,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Palette.textPrimary,
    },
    userEmail: {
        fontSize: 14,
        color: Palette.textSecondary,
    },
    editProfileButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: Palette.white,
        borderBottomWidth: 1,
        borderBottomColor: Palette.divider,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Palette.textPrimary,
    },
    statHighlight: {
        color: Palette.yellow,
    },
    statLabel: {
        fontSize: 14,
        color: Palette.textSecondary,
    },
    actionCards: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    card: {
        backgroundColor: Palette.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Palette.divider,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Palette.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Palette.textSecondary,
        marginTop: 4,
    },
    arrowContainer: {
        paddingLeft: 8,
    },
    arrow: {
        fontSize: 18,
        color: Palette.textSecondary,
    },
    logoutCard: {
        borderColor: Palette.yellow,
        borderWidth: 1,
    },
    logoutTitle: {
        color: Palette.yellow,
    },
    logoutSubtitle: {
        color: Palette.yellow,
    },
    logoutArrow: {
        color: Palette.yellow,
    },
    versionContainer: {
        padding: 20,
        backgroundColor: Palette.white,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: Palette.textSecondary,
    },
});

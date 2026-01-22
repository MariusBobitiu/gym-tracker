import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import React from 'react'
import { Button } from './button'
import { View } from 'react-native'
import { useTheme } from '@/lib/theme-context'

const BackButton = () => {
	const { colors } = useTheme();

	return (
		<Button 
		onPress={() => router.back()} 
		variant='link' 
		icon={<Ionicons name="chevron-back" size={24} color={colors.foreground} />} 
		style={{
			backgroundColor: colors.card.toString() + '20',
			borderRadius: 100,
			padding: 4,
			width: 36,
			height: 36,
			borderWidth: 1,
			borderColor: colors.border,
			backdropFilter: 'blur(10px)',
			boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
			elevation: 10,
		}}
		className='p-0'
		/>
	)
}

const BackHeader = ({ elements }: { elements?: React.ReactNode[] }) => {
	return (
		<View className="flex-row items-center justify-between -mt-4 mb-2">
			<BackButton />
			{elements?.map((element, index) => (
				<React.Fragment key={index}>
					{element as React.ReactNode}
				</React.Fragment>
			))}
		</View>
	)
}

export default BackHeader
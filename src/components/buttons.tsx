import React from 'react';

import { Button, View } from '@/components/ui';

import { Title } from './title';
import { ScrollView } from 'moti';

export const Buttons = () => {
  return (
    <>
      <Title text="Buttons" />
      <ScrollView className="flex-1">
        <View className="flex-row  flex-wrap">
          <Button label="small" size="sm" className="mr-2" />
          <Button label="small" size="sm" className="mr-2" variant="primary" />
          <Button
            label="small"
            loading
            size="sm"
            className="mr-2 min-w-[60px]"
          />
          <Button
            label="small"
            size="sm"
            loading
            variant="primary"
            className="mr-2 min-w-[60px]"
          />
          <Button
            label="small"
            size="sm"
            variant="secondary"
            className="mr-2"
          />
          <Button label="small" size="sm" variant="outline" className="mr-2" />
          <Button
            label="small"
            size="sm"
            variant="destructive"
            className="mr-2"
          />
          <Button label="small" size="sm" variant="ghost" className="mr-2" />
          <Button label="small" size="sm" disabled className="mr-2" />
        </View>
        <Button label="Default Button" />
        <Button label="Primary Button" variant="primary" />
        <Button label="Secondary Button" variant="secondary" />
        <Button label="Outline Button" variant="outline" />
        <Button label="Destructive Button" variant="destructive" />
        <Button label="Ghost Button" variant="ghost" />
        <Button label="Button" loading={true} />
        <Button label="Button" loading={true} variant="outline" />
        <Button label="Default Button Disabled" disabled />
        <Button
          label="Primary Button Disabled"
          disabled
          variant="primary"
        />
        <Button
          label="Secondary Button Disabled"
          disabled
          variant="secondary"
        />
        <Button
          label="Destructive Button Disabled"
          disabled
          variant="destructive"
        />
      </ScrollView>
    </>
  );
};

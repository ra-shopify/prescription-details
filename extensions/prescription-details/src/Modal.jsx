import React, { useState } from 'react'
import { 
  Text, 
  Screen, 
  Section, 
  List, 
  ScrollView, 
  Navigator, 
  Button, 
  TextField,
  SegmentedControl,
  useApi,
  reactExtension 
} from '@shopify/ui-extensions-react/point-of-sale'

const Modal = () => {
  const api = useApi();
  
  // State for all form selections
  const [prescriptionType, setPrescriptionType] = useState('Single Vision');
  const [rightEyeData, setRightEyeData] = useState({
    sph: null,
    cyl: null,
    add: null,
    axis: ''
  });
  const [leftEyeData, setLeftEyeData] = useState({
    sph: null,
    cyl: null,
    add: null,
    axis: ''
  });
  const [pdType, setPdType] = useState('single'); // 'single' or 'dual'
  const [pupillaryDistance, setPupillaryDistance] = useState(null);
  const [rightPD, setRightPD] = useState(null);
  const [leftPD, setLeftPD] = useState(null);
  const [lensType, setLensType] = useState('Clear');
  const [lensMaterial, setLensMaterial] = useState('Standard');
  const [lensTreatment, setLensTreatment] = useState('Anti-reflective treatment');
  const [lensBrand, setLensBrand] = useState('Standard');
  const [saving, setSaving] = useState(false);

  // Generate value ranges
  const generateSPHValues = () => {
    const values = [];
    for (let i = -6.00; i <= 4.00; i += 0.25) {
      values.push({ value: i.toFixed(2), label: i.toFixed(2) });
    }
    return values;
  };

  const generateCYLValues = () => {
    const values = [];
    for (let i = -3.00; i <= 3.00; i += 0.25) {
      values.push({ value: i.toFixed(2), label: i.toFixed(2) });
    }
    return values;
  };

  const generateADDValues = () => {
    const values = [];
    for (let i = 0.75; i <= 4.00; i += 0.25) {
      values.push({ value: i.toFixed(2), label: i.toFixed(2) });
    }
    return values;
  };

  const generatePDValues = () => {
    const values = [];
    for (let i = 56; i <= 78; i++) {
      values.push({ value: i.toString(), label: `${i}mm` });
    }
    return values;
  };

  const generateDualPDValues = () => {
    const values = [];
    for (let i = 28; i <= 39; i++) {
      values.push({ value: i.toString(), label: `${i}mm` });
    }
    return values;
  };

  // Value arrays
  const sphValues = generateSPHValues();
  const cylValues = generateCYLValues();
  const addValues = generateADDValues();
  const pdValues = generatePDValues();
  const dualPdValues = generateDualPDValues();

  // Helper function to get button type for selections
  const getButtonType = (currentValue, optionValue) => {
    return currentValue === optionValue ? 'primary' : 'plain';
  };

  // Helper function to format price display
  const formatPrice = (amount) => {
    if (!amount || amount === 0) return "";
    return ` (+$${amount})`;
  };

  // Helper function to validate axis input
  const handleAxisChange = (value, eye) => {
    // Allow empty string
    if (value === '') {
      if (eye === 'right') {
        setRightEyeData(prev => ({ ...prev, axis: '' }));
      } else {
        setLeftEyeData(prev => ({ ...prev, axis: '' }));
      }
      return;
    }
    
    // Only allow numeric input
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 180) {
      if (eye === 'right') {
        setRightEyeData(prev => ({ ...prev, axis: value }));
      } else {
        setLeftEyeData(prev => ({ ...prev, axis: value }));
      }
    }
  };

  // Create list data for value selections
  const createValueListData = (values, currentValue, onSelect, eye = null, field = null) => {
    return values.map(item => ({
      id: item.value,
      leftSide: {
        label: item.label,
        subtitle: currentValue === item.value ? 
          [{ content: 'Selected', color: 'TextSuccess' }] : []
      },
      rightSide: {
        label: currentValue === item.value ? 'Selected' : 'Select',
        showChevron: false
      },
      onPress: () => {
        if (eye && field) {
          if (eye === 'right') {
            setRightEyeData(prev => ({ ...prev, [field]: item.value }));
          } else {
            setLeftEyeData(prev => ({ ...prev, [field]: item.value }));
          }
        } else {
          onSelect(item.value);
        }
        api.navigation.navigate('PrescriptionForm');
      }
    }));
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    let totalPrice = 299.00; // Baseline price
    
    // Add lens type pricing (add-ons on top of baseline)
    if (lensType === 'Clear' || lensType === 'Sun') {
      totalPrice += 235.00;
    } else if (lensType === 'Blue-Violet Light Filter') {
      totalPrice += 275.00;
    } else if (lensType === 'Transitions') {
      totalPrice += 335.00;
    }
    
    // Add lens material pricing
    if (lensMaterial === 'Thin') {
      totalPrice += 40.00;
    } else if (lensMaterial === 'Extra-thin') {
      totalPrice += 120.00;
    }
    
    // Add lens treatment pricing
    if (lensTreatment === 'Premium anti-reflection treatment') {
      totalPrice += 30.00;
    }
    
    // Add lens brand pricing
    if (lensBrand === 'Ray-Ban Authentic') {
      totalPrice += 40.00;
    }
    
    return totalPrice;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSaving(true);
    
    try {
      // Validate required fields
      const pdValid = pdType === 'single' ? pupillaryDistance : (rightPD && leftPD);
      if (!rightEyeData.sph || !leftEyeData.sph || !pdValid) {
        api.toast.show('Please fill in all required fields', { type: 'error' });
        setSaving(false);
        return;
      }

      // Calculate total price
      const totalPrice = calculateTotalPrice();

      // Create custom sale item
      const customSaleItemUUID = await api.cart.addCustomSale({
        title: 'Prescription Glasses',
        price: totalPrice.toFixed(2),
        quantity: 1,
        taxable: true
      });

      if (!customSaleItemUUID) {
        api.toast.show('Failed to create custom sale item', { type: 'error' });
        setSaving(false);
        return;
      }

      // Create prescription data properties
      const prescriptionProperties = {
        'Prescription Type': prescriptionType,
        'Right Eye SPH': rightEyeData.sph || 'N/A',
        'Right Eye CYL': rightEyeData.cyl || 'N/A',
        'Right Eye ADD': rightEyeData.add || 'N/A',
        'Right Eye Axis': rightEyeData.axis || 'N/A',
        'Left Eye SPH': leftEyeData.sph || 'N/A',
        'Left Eye CYL': leftEyeData.cyl || 'N/A',
        'Left Eye ADD': leftEyeData.add || 'N/A',
        'Left Eye Axis': leftEyeData.axis || 'N/A',
        ...(pdType === 'single' 
          ? { 'PD Value': pupillaryDistance ? `${pupillaryDistance}mm` : 'N/A' }
          : { 
              'Right PD Value': rightPD ? `${rightPD}mm` : 'N/A',
              'Left PD Value': leftPD ? `${leftPD}mm` : 'N/A'
            }
        ),
        'Lens Type': lensType,
        'Lens Material': lensMaterial,
        'Lens Treatment': lensTreatment,
        'Lens Brand': lensBrand,
        'Total Price': `$${totalPrice.toFixed(2)}`,
        'Prescription Details': 'Complete'
      };

      // Add line item properties to the custom sale item
      await api.cart.addLineItemProperties(customSaleItemUUID, prescriptionProperties);

      // Log the data for debugging
      console.log('Custom Sale Item UUID:', customSaleItemUUID);
      console.log('Prescription Properties:', prescriptionProperties);
      console.log('Total Price:', totalPrice);
      
      api.toast.show(`Prescription glasses added to cart - $${totalPrice.toFixed(2)}`, { type: 'success' });
      
      // Close the modal
      api.navigation.dismiss();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      api.toast.show('Failed to save prescription details. Please try again.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    api.navigation.dismiss();
  };

  // Validate prescription step and continue
  const handlePrescriptionContinue = () => {
    const pdValid = pdType === 'single' ? pupillaryDistance : (rightPD && leftPD);
    if (!rightEyeData.sph || !leftEyeData.sph || !pdValid) {
      api.toast.show('Please fill in all required fields', { type: 'error' });
      return;
    }
    api.navigation.navigate('LensOptions');
  };

  return (
    <Navigator>
      <Screen name="PrescriptionForm" title="Prescription Details">
        <ScrollView>
          {/* Prescription Type Section */}
          <Section title="Prescription Type">
            <Button
              title="Single Vision"
              type={getButtonType(prescriptionType, 'Single Vision')}
              onPress={() => setPrescriptionType('Single Vision')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title="Progression"
              type={getButtonType(prescriptionType, 'Progression')}
              onPress={() => setPrescriptionType('Progression')}
              disabled={saving}
            />
          </Section>

          {/* Right Eye Section */}
          <Section title="Right Eye - OD">
            <List data={[
              {
                id: 'right-sph',
                leftSide: {
                  label: 'SPH (Sphere)',
                  subtitle: rightEyeData.sph ? 
                    [{ content: rightEyeData.sph, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('RightSPHSelection')
              },
              {
                id: 'right-cyl',
                leftSide: {
                  label: 'CYL (Cylinder)',
                  subtitle: rightEyeData.cyl ? 
                    [{ content: rightEyeData.cyl, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('RightCYLSelection')
              },
              {
                id: 'right-add',
                leftSide: {
                  label: 'ADD (Addition)',
                  subtitle: rightEyeData.add ? 
                    [{ content: rightEyeData.add, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('RightADDSelection')
              }
            ]} />
            <TextField
              label="Axis (1-180)"
              value={rightEyeData.axis}
              onChange={(value) => handleAxisChange(value, 'right')}
              placeholder="Enter axis value (1-180)"
            />
          </Section>

          {/* Left Eye Section */}
          <Section title="Left Eye - OS">
            <List data={[
              {
                id: 'left-sph',
                leftSide: {
                  label: 'SPH (Sphere)',
                  subtitle: leftEyeData.sph ? 
                    [{ content: leftEyeData.sph, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('LeftSPHSelection')
              },
              {
                id: 'left-cyl',
                leftSide: {
                  label: 'CYL (Cylinder)',
                  subtitle: leftEyeData.cyl ? 
                    [{ content: leftEyeData.cyl, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('LeftCYLSelection')
              },
              {
                id: 'left-add',
                leftSide: {
                  label: 'ADD (Addition)',
                  subtitle: leftEyeData.add ? 
                    [{ content: leftEyeData.add, color: 'TextSuccess' }] : 
                    [{ content: 'Select value', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('LeftADDSelection')
              }
            ]} />
            <TextField
              label="Axis (1-180)"
              value={leftEyeData.axis}
              onChange={(value) => handleAxisChange(value, 'left')}
              placeholder="Enter axis value (1-180)"
            />
          </Section>

          {/* Pupillary Distance Section */}
          <Section title="Pupillary Distance">
            <SegmentedControl
              segments={[
                { id: 'single', label: 'PD Value', disabled: saving },
                { id: 'dual', label: '2PD Values', disabled: saving }
              ]}
              selected={pdType}
              onSelect={setPdType}
            />
            <Text></Text>
            
            {pdType === 'single' ? (
              <List data={[{
                id: 'pd',
                leftSide: {
                  label: 'Distance',
                  subtitle: pupillaryDistance ? 
                    [{ content: `${pupillaryDistance}mm`, color: 'TextSuccess' }] : 
                    [{ content: 'Select distance', color: 'TextSubdued' }]
                },
                rightSide: { showChevron: true },
                onPress: () => api.navigation.navigate('PDSelection')
              }]} />
            ) : (
              <List data={[
                {
                  id: 'right-pd',
                  leftSide: {
                    label: 'Right PD',
                    subtitle: rightPD ? 
                      [{ content: `${rightPD}mm`, color: 'TextSuccess' }] : 
                      [{ content: 'Select distance', color: 'TextSubdued' }]
                  },
                  rightSide: { showChevron: true },
                  onPress: () => api.navigation.navigate('RightPDSelection')
                },
                {
                  id: 'left-pd',
                  leftSide: {
                    label: 'Left PD',
                    subtitle: leftPD ? 
                      [{ content: `${leftPD}mm`, color: 'TextSuccess' }] : 
                      [{ content: 'Select distance', color: 'TextSubdued' }]
                  },
                  rightSide: { showChevron: true },
                  onPress: () => api.navigation.navigate('LeftPDSelection')
                }
              ]} />
            )}
          </Section>









          {/* Submit and Continue Buttons */}
          <Section title="Prescription">
            <Button 
              title="Submit and Continue" 
              type="primary" 
              onPress={handlePrescriptionContinue}
              disabled={saving}
            />
            <Text></Text>
            <Button 
              title="Cancel" 
              type="destructive" 
              onPress={handleCancel}
              disabled={saving}
            />
          </Section>
        </ScrollView>
      </Screen>

      {/* Lens Options Screen */}
      <Screen name="LensOptions" title="Lens Options">
        <ScrollView>
          {/* Lens Type Section */}
          <Section title="Lens Type">
            <Button
              title={`Clear (+$235.00)`}
              type={getButtonType(lensType, 'Clear')}
              onPress={() => setLensType('Clear')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Blue-Violet Light Filter (+$275.00)`}
              type={getButtonType(lensType, 'Blue-Violet Light Filter')}
              onPress={() => setLensType('Blue-Violet Light Filter')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Sun (+$235.00)`}
              type={getButtonType(lensType, 'Sun')}
              onPress={() => setLensType('Sun')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Transitions (+$335.00)`}
              type={getButtonType(lensType, 'Transitions')}
              onPress={() => setLensType('Transitions')}
              disabled={saving}
            />
          </Section>

          {/* Lens Material Section */}
          <Section title="Lens Material">
            <Button
              title="Standard (Included)"
              type={getButtonType(lensMaterial, 'Standard')}
              onPress={() => setLensMaterial('Standard')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Thin${formatPrice(40)}`}
              type={getButtonType(lensMaterial, 'Thin')}
              onPress={() => setLensMaterial('Thin')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Extra-thin${formatPrice(120)}`}
              type={getButtonType(lensMaterial, 'Extra-thin')}
              onPress={() => setLensMaterial('Extra-thin')}
              disabled={saving}
            />
          </Section>

          {/* Lens Treatment Section */}
          <Section title="Lens Treatment">
            <Button
              title="Anti-reflective treatment"
              type={getButtonType(lensTreatment, 'Anti-reflective treatment')}
              onPress={() => setLensTreatment('Anti-reflective treatment')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Premium anti-reflection treatment${formatPrice(30)}`}
              type={getButtonType(lensTreatment, 'Premium anti-reflection treatment')}
              onPress={() => setLensTreatment('Premium anti-reflection treatment')}
              disabled={saving}
            />
          </Section>

          {/* Lens Brand Section */}
          <Section title="Lens Brand">
            <Button
              title="Standard (Included)"
              type={getButtonType(lensBrand, 'Standard')}
              onPress={() => setLensBrand('Standard')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title={`Ray-Ban Authentic${formatPrice(40)}`}
              type={getButtonType(lensBrand, 'Ray-Ban Authentic')}
              onPress={() => setLensBrand('Ray-Ban Authentic')}
              disabled={saving}
            />
          </Section>

          {/* Navigation Buttons */}
          <Section title="Continue">
            <Button
              title="Review"
              type="primary"
              onPress={() => api.navigation.navigate('ReviewAndAdd')}
              disabled={saving}
            />
            <Text></Text>
            <Button
              title="Back"
              type="plain"
              onPress={() => api.navigation.navigate('PrescriptionForm')}
              disabled={saving}
            />
          </Section>
        </ScrollView>
      </Screen>

      {/* Right Eye Selection Screens */}
      <Screen name="RightSPHSelection" title="Right Eye - SPH">
        <ScrollView>
          <Section title="Select SPH Value">
            <List data={createValueListData(sphValues, rightEyeData.sph, null, 'right', 'sph')} />
          </Section>
        </ScrollView>
      </Screen>

      <Screen name="RightCYLSelection" title="Right Eye - CYL">
        <ScrollView>
          <Section title="Select CYL Value">
            <List data={createValueListData(cylValues, rightEyeData.cyl, null, 'right', 'cyl')} />
          </Section>
        </ScrollView>
      </Screen>

      <Screen name="RightADDSelection" title="Right Eye - ADD">
        <ScrollView>
          <Section title="Select ADD Value">
            <List data={createValueListData(addValues, rightEyeData.add, null, 'right', 'add')} />
          </Section>
        </ScrollView>
      </Screen>

      {/* Left Eye Selection Screens */}
      <Screen name="LeftSPHSelection" title="Left Eye - SPH">
        <ScrollView>
          <Section title="Select SPH Value">
            <List data={createValueListData(sphValues, leftEyeData.sph, null, 'left', 'sph')} />
          </Section>
        </ScrollView>
      </Screen>

      <Screen name="LeftCYLSelection" title="Left Eye - CYL">
        <ScrollView>
          <Section title="Select CYL Value">
            <List data={createValueListData(cylValues, leftEyeData.cyl, null, 'left', 'cyl')} />
          </Section>
        </ScrollView>
      </Screen>

      <Screen name="LeftADDSelection" title="Left Eye - ADD">
        <ScrollView>
          <Section title="Select ADD Value">
            <List data={createValueListData(addValues, leftEyeData.add, null, 'left', 'add')} />
          </Section>
        </ScrollView>
      </Screen>

      {/* Pupillary Distance Selection Screen */}
      <Screen name="PDSelection" title="Pupillary Distance">
        <ScrollView>
          <Section title="Select Distance">
            <List data={createValueListData(pdValues, pupillaryDistance, setPupillaryDistance)} />
          </Section>
        </ScrollView>
      </Screen>

      {/* Dual PD Selection Screens */}
      <Screen name="RightPDSelection" title="Right PD">
        <ScrollView>
          <Section title="Select Right PD">
            <List data={createValueListData(dualPdValues, rightPD, setRightPD)} />
          </Section>
        </ScrollView>
      </Screen>

      <Screen name="LeftPDSelection" title="Left PD">
        <ScrollView>
          <Section title="Select Left PD">
            <List data={createValueListData(dualPdValues, leftPD, setLeftPD)} />
          </Section>
        </ScrollView>
      </Screen>

      {/* Review and Add Screen */}
      <Screen name="ReviewAndAdd" title="Review and Add to Bag">
        <ScrollView>
          <Section title="Selections">
            <List data={[
              { id: 'prescription-type', leftSide: { label: 'Prescription Type', subtitle: [{ content: prescriptionType, color: 'TextSubdued' }] } },
              { id: 'right-eye', leftSide: { label: 'Right Eye (OD)', subtitle: [
                { content: `SPH: ${rightEyeData.sph || 'N/A'}`, color: 'TextSubdued' },
                { content: `CYL: ${rightEyeData.cyl || 'N/A'}`, color: 'TextSubdued' },
                { content: `ADD: ${rightEyeData.add || 'N/A'}`, color: 'TextSubdued' },
                { content: `Axis: ${rightEyeData.axis || 'N/A'}`, color: 'TextSubdued' },
              ] } },
              { id: 'left-eye', leftSide: { label: 'Left Eye (OS)', subtitle: [
                { content: `SPH: ${leftEyeData.sph || 'N/A'}`, color: 'TextSubdued' },
                { content: `CYL: ${leftEyeData.cyl || 'N/A'}`, color: 'TextSubdued' },
                { content: `ADD: ${leftEyeData.add || 'N/A'}`, color: 'TextSubdued' },
                { content: `Axis: ${leftEyeData.axis || 'N/A'}`, color: 'TextSubdued' },
              ] } },
              { id: 'pd', leftSide: { label: 'Pupillary Distance', subtitle: [
                ...(pdType === 'single' ? [{ content: `${pupillaryDistance || 'N/A'}mm`, color: 'TextSubdued' }] : [
                  { content: `Right: ${rightPD || 'N/A'}mm`, color: 'TextSubdued' },
                  { content: `Left: ${leftPD || 'N/A'}mm`, color: 'TextSubdued' },
                ])
              ] } },
              { id: 'lens-type', leftSide: { label: 'Lens Type', subtitle: [{ content: lensType, color: 'TextSubdued' }] } },
              { id: 'lens-material', leftSide: { label: 'Lens Material', subtitle: [{ content: lensMaterial, color: 'TextSubdued' }] } },
              { id: 'lens-treatment', leftSide: { label: 'Lens Treatment', subtitle: [{ content: lensTreatment, color: 'TextSubdued' }] } },
              { id: 'lens-brand', leftSide: { label: 'Lens Brand', subtitle: [{ content: lensBrand, color: 'TextSubdued' }] } },
            ]} />
          </Section>

          <Section title="Price Summary">
            <List data={[{
              id: 'price-summary',
              leftSide: {
                label: 'Total Price',
                subtitle: [
                  { content: 'Base: $299.00', color: 'TextSubdued' },
                  { content: `Add-ons: $${(calculateTotalPrice() - 299).toFixed(2)}`, color: 'TextSubdued' }
                ]
              },
              rightSide: {
                label: `$${calculateTotalPrice().toFixed(2)}`,
                showChevron: false
              }
            }]} />
          </Section>

          <Section title="Actions">
            <Button 
              title={saving ? "Adding..." : `Add to Bag - $${calculateTotalPrice().toFixed(2)}`} 
              type="primary" 
              onPress={handleSubmit}
              disabled={saving}
            />
            <Text></Text>
            <Button 
              title="Back" 
              type="plain" 
              onPress={() => api.navigation.navigate('LensOptions')}
              disabled={saving}
            />
          </Section>
        </ScrollView>
      </Screen>
    </Navigator>
  )
}

export default reactExtension('pos.home.modal.render', () => <Modal />);
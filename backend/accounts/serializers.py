from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'phone', 'role', 'password', 'password2')
        extra_kwargs = {
            'name': {'required': True},
            'email': {'required': True},
            'phone': {'required': True, 'allow_blank': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'phone', 'role', 'email_verified', 'phone_verified', 'created_at')
        read_only_fields = ('user_id', 'email_verified', 'phone_verified', 'created_at')


